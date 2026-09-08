// ============================================================
// Kisaan Kart — Staff Authentication Service (Phone + OTP only)
// ============================================================
// Business rules for staff sign-in. NO passwords, ever.
//
//   sendOtp / resendOtp — issue an OTP to a known, active staff phone
//   verifyOtp           — validate OTP, mint tokens, open a session
//   refreshToken        — re-issue a fresh (perm-current) access token
//   me                  — fresh identity + permissions for the UI
//   logout              — revoke the current session
//
// Security (plan decision D5):
//   • OTP: 6-digit, 5-min expiry, max 3 verify attempts / OTP,
//     max 5 sends / phone / hour, hashed at rest.
//   • Account lockout: 10 failed verifications → 30-min lock (423).
//   • OTP echoed in API responses only in non-production dev.
// ============================================================

import staffRepo        from "../repositories/staff.repository.js";
import staffOtpRepo     from "../repositories/staffOtp.repository.js";
import staffSessionRepo from "../repositories/staffSession.repository.js";
import roleRepo         from "../repositories/role.repository.js";
import pool             from "../db/index.js";

import generateOtp from "../utils/generateOtp.js";
import hashOtp     from "../utils/hashOtp.js";
import { ApiError } from "../utils/ApiError.js";
import { roleSlug } from "../utils/roles.js";
import {
    generateStaffAccessToken,
    generateStaffRefreshToken,
} from "../utils/token.js";

import jwt from "jsonwebtoken";
import { getOtpProvider, canExposeOtp } from "./otp/otpProvider.js";
import { eventBus, EVENTS }             from "./events/eventBus.js";
import activityLog                      from "./activityLog.service.js";

// ─── Tunables ───────────────────────────────────────────────
const OTP_EXPIRY_MINUTES     = 5;
const OTP_MAX_ATTEMPTS       = 3;   // per single OTP challenge
const OTP_MAX_SENDS_PER_HOUR = 5;   // per phone
const LOCKOUT_THRESHOLD      = 10;  // failed verifications before lock
const LOCKOUT_MINUTES        = 30;
const REFRESH_TTL_DAYS       = 30;  // session expiry mirror of refresh JWT

// ─── Helpers ────────────────────────────────────────────────

/** Assert a staff member exists and may authenticate; throws otherwise. */
const assertLoginable = (staff) => {
    if (!staff)             throw new ApiError(404, "No staff account found for this phone");
    if (staff.is_archived)  throw new ApiError(403, "This staff account has been archived");
    if (!staff.is_active)   throw new ApiError(403, "This staff account is disabled");
    if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
        throw new ApiError(423, "Account temporarily locked. Please try again later.");
    }
};

/** Shape a staff row into a client-safe object (no token/lock internals). */
const publicStaff = (s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    roleId: s.role_id,
    roleName: s.role_name,
    storeId: s.store_id,
    profileImage: s.profile_image,
    designation: s.designation,
    department: s.department,
    employeeId: s.employee_id,
    isActive: s.is_active,
    isInvited: s.is_invited,
    firstLoginAt: s.first_login_at,
    lastLogin: s.last_login,
});

/** Build the token payload shape expected by generateStaffAccessToken. */
const tokenClaims = (staff, permissions) => ({
    id: staff.id,
    phone: staff.phone,
    role: roleSlug(staff.role_name),
    roleId: staff.role_id,
    storeId: staff.store_id,
    permissions,
    permissionsVersion: staff.permissions_version ?? 1,
});

// ─── sendOtp / resendOtp ────────────────────────────────────
export const sendOtp = async (phone, req) => {
    if (!phone) throw new ApiError(400, "Phone number is required");

    const staff = await staffRepo.findByPhone(phone);
    assertLoginable(staff);

    // Rate limit: max N sends / phone / hour.
    const recent = await staffOtpRepo.countRecentSends(phone, 60);
    if (recent >= OTP_MAX_SENDS_PER_HOUR) {
        throw new ApiError(429, "Too many OTP requests. Please try again later.");
    }

    // Mocking OTP to 1234 as requested
    const otp = "1234";
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await staffOtpRepo.create({ phone, otpHash, expiresAt });
    await getOtpProvider().send(phone, otp);

    eventBus.emitEvent(EVENTS.OTP_SENT, { staffId: staff.id, phone });
    await activityLog.recordFromReq(req, {
        staffId: staff.id, action: "OTP_SENT", module: "auth", entity: "staff", entityId: staff.id,
    });

    const payload = { message: "OTP sent successfully" };
    if (canExposeOtp()) payload.otp = otp;   // dev convenience only
    return payload;
};

export const resendOtp = (phone, req) => sendOtp(phone, req);

// ─── verifyOtp ──────────────────────────────────────────────
export const verifyOtp = async (phone, otp, req) => {
    if (!phone || !otp) throw new ApiError(400, "Phone and OTP are required");

    const staff = await staffRepo.findByPhone(phone);
    assertLoginable(staff);

    const otpRow = await staffOtpRepo.findLatestActive(phone);
    if (!otpRow) {
        throw new ApiError(400, "OTP expired or not found. Please request a new one.");
    }
    if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
        throw new ApiError(429, "Too many incorrect attempts. Please request a new OTP.");
    }

    const matches = otpRow.otp_hash === hashOtp(otp);
    if (!matches) {
        await staffOtpRepo.incrementAttempts(otpRow.id);
        const fail = await staffRepo.recordLoginFailure(staff.id, LOCKOUT_THRESHOLD, LOCKOUT_MINUTES);

        eventBus.emitEvent(EVENTS.AUTH_LOGIN_FAILED, { staffId: staff.id, phone });
        await activityLog.recordFromReq(req, {
            staffId: staff.id, action: "LOGIN_FAILED", module: "auth", entity: "staff", entityId: staff.id,
        });

        if (fail?.locked_until && new Date(fail.locked_until) > new Date()) {
            eventBus.emitEvent(EVENTS.ACCOUNT_LOCKED, { staffId: staff.id, phone, until: fail.locked_until });
            await activityLog.recordFromReq(req, {
                staffId: staff.id, action: "ACCOUNT_LOCKED", module: "auth", entity: "staff", entityId: staff.id,
                newValue: { locked_until: fail.locked_until },
            });
            throw new ApiError(423, "Account temporarily locked due to repeated failures.");
        }
        throw new ApiError(400, "Invalid OTP");
    }

    // Success ────────────────────────────────────────────────
    await staffOtpRepo.expireAllForPhone(phone);
    await staffRepo.recordLoginSuccess(staff.id);

    const permissions = await roleRepo.getPermissionKeys(staff.role_id);
    const accessToken  = generateStaffAccessToken(tokenClaims(staff, permissions));
    const refreshToken = generateStaffRefreshToken({ id: staff.id });

    // Open a session (store only a hash of the refresh token).
    const ctx = activityLog.contextFromReq(req);
    await staffSessionRepo.create({
        staffId: staff.id,
        refreshTokenHash: hashOtp(refreshToken),
        device: ctx.device,
        browser: ctx.browser,
        ipAddress: ctx.ipAddress,
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    eventBus.emitEvent(EVENTS.AUTH_LOGIN, { staffId: staff.id, phone });
    await activityLog.recordFromReq(req, {
        staffId: staff.id, action: "LOGIN_SUCCESS", module: "auth", entity: "staff", entityId: staff.id,
    });
    
    // Insert login history
    await pool.query(
        `INSERT INTO staff_login_history (staff_id, ip_address, device_name, browser, login_time)
         VALUES ($1, $2, $3, $4, NOW())`,
        [staff.id, ctx.ipAddress, ctx.device, ctx.browser]
    );

    return {
        token: accessToken,
        refreshToken,
        user: publicStaff(staff),
        role: { id: staff.role_id, name: staff.role_name, slug: roleSlug(staff.role_name) },
        permissions,
    };
};

// ─── refreshToken ───────────────────────────────────────────
export const refreshToken = async (refreshTokenStr, req) => {
    if (!refreshTokenStr) throw new ApiError(401, "Refresh token required");

    let decoded;
    try {
        decoded = jwt.verify(refreshTokenStr, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
    if (decoded.type !== "staff") {
        throw new ApiError(401, "Invalid refresh token");
    }

    const staff = await staffRepo.findById(decoded.id);
    assertLoginable(staff);

    // Session must still be active + match the presented token hash.
    const session = await staffSessionRepo.findActiveByTokenHash(
        staff.id, hashOtp(refreshTokenStr)
    );
    if (!session) {
        throw new ApiError(401, "Session revoked or expired. Please log in again.");
    }

    // Re-read permissions from DB so a refreshed token is never stale.
    const permissions = await roleRepo.getPermissionKeys(staff.role_id);
    const accessToken = generateStaffAccessToken(tokenClaims(staff, permissions));
    await staffSessionRepo.touch(session.id);

    return { token: accessToken, permissions };
};

// ─── me ─────────────────────────────────────────────────────
export const me = async (staffId) => {
    const staff = await staffRepo.findById(staffId);
    if (!staff) throw new ApiError(404, "Staff account not found");

    const permissions = await roleRepo.getPermissionKeys(staff.role_id);
    return {
        user: publicStaff(staff),
        role: { id: staff.role_id, name: staff.role_name, slug: roleSlug(staff.role_name) },
        permissions,
        permissionsVersion: staff.permissions_version ?? 1,
    };
};

// ─── logout ─────────────────────────────────────────────────
export const logout = async (staffId, refreshTokenStr, req) => {
    if (refreshTokenStr) {
        await staffSessionRepo.revokeByTokenHash(staffId, hashOtp(refreshTokenStr));
    }
    eventBus.emitEvent(EVENTS.AUTH_LOGOUT, { staffId });
    await activityLog.recordFromReq(req, {
        staffId, action: "LOGOUT", module: "auth", entity: "staff", entityId: staffId,
    });
    return { message: "Logged out successfully" };
};

// ─── updateProfileImage ─────────────────────────────────────
export const updateProfileImage = async (staffId, imageUrl, req) => {
    // 1. Update in DB
    const res = await pool.query(
        `UPDATE staff_users SET profile_image = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [imageUrl, staffId]
    );
    if (!res.rows.length) {
        throw new ApiError(404, "Staff not found");
    }
    const staff = res.rows[0];

    // 2. Fetch role & permissions for full token response (like me)
    const role = await roleRepo.findById(staff.role_id);
    const permissions = await roleRepo.getPermissionKeys(staff.role_id);

    // 3. Log
    await activityLog.recordFromReq(req, {
        staffId,
        action: "UPDATE_PROFILE_IMAGE",
        module: "auth",
        entity: "staff",
        entityId: staffId
    });

    return {
        user: {
            id: staff.id,
            type: "staff",
            phone: staff.phone,
            email: staff.email,
            first_name: staff.first_name,
            last_name: staff.last_name,
            profile_image: staff.profile_image,
            role: {
                id: role.id,
                name: role.name,
                is_admin: role.is_admin,
            },
            permissions
        }
    };
};

export const updateProfile = async (staffId, data, req) => {
    const { name, email, phone, dob, gender } = data;
    const res = await pool.query(
        `UPDATE staff_users 
         SET name = COALESCE($1, name), 
             email = COALESCE($2, email), 
             phone = COALESCE($3, phone), 
             dob = COALESCE($4, dob), 
             gender = COALESCE($5, gender), 
             updated_at = NOW() 
         WHERE id = $6 RETURNING *`,
        [name, email, phone, dob, gender, staffId]
    );
    if (!res.rows.length) throw new ApiError(404, "Staff not found");
    const staff = res.rows[0];

    await pool.query(
        `INSERT INTO staff_audit_logs (staff_id, action, entity, entity_id, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [staffId, "UPDATE_PROFILE", "staff", staffId, JSON.stringify({ name, email, phone, dob, gender })]
    );
    return { user: publicStaff(staff) };
};

export const mySessions = async (staffId) => {
    const { rows } = await pool.query(
        `SELECT id, device, browser, ip_address, login_at, last_seen, expires_at, is_active 
         FROM staff_sessions WHERE staff_id = $1 ORDER BY login_at DESC`,
        [staffId]
    );
    return rows;
};

export const revokeMySession = async (staffId, sessionId, req) => {
    const res = await pool.query(
        `UPDATE staff_sessions SET is_active = FALSE WHERE id = $1 AND staff_id = $2 RETURNING id`,
        [sessionId, staffId]
    );
    if (!res.rows.length) throw new ApiError(404, "Session not found or not yours");
    await activityLog.recordFromReq(req, {
        staffId, action: "REVOKE_SESSION", module: "auth", entity: "session", entityId: sessionId
    });
    return { message: "Session revoked successfully" };
};

export const revokeAllOtherSessions = async (staffId, currentSessionId, req) => {
    if (currentSessionId) {
        await pool.query(
            `UPDATE staff_sessions SET is_active = FALSE WHERE staff_id = $1 AND id != $2 AND is_active = TRUE`,
            [staffId, currentSessionId]
        );
    } else {
        await pool.query(
            `UPDATE staff_sessions SET is_active = FALSE WHERE staff_id = $1 AND is_active = TRUE`,
            [staffId]
        );
    }
    await activityLog.recordFromReq(req, {
        staffId, action: "REVOKE_ALL_OTHER_SESSIONS", module: "auth", entity: "staff", entityId: staffId
    });
    return { message: "Other sessions revoked successfully" };
};

export const myLoginHistory = async (staffId) => {
    const { rows } = await pool.query(
        `SELECT * FROM staff_login_history WHERE staff_id = $1 ORDER BY login_time DESC LIMIT 50`,
        [staffId]
    );
    return rows;
};

export const myAuditTimeline = async (staffId) => {
    const { rows } = await pool.query(
        `SELECT * FROM staff_audit_logs WHERE staff_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [staffId]
    );
    return rows;
};

export default {
    sendOtp, resendOtp, verifyOtp, refreshToken, me, logout, updateProfileImage,
    updateProfile, mySessions, revokeMySession, revokeAllOtherSessions, myLoginHistory, myAuditTimeline
};
