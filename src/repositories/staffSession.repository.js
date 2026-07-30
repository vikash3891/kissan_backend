// ============================================================
// Kisaan Kart — Staff Session Repository
// ============================================================
// Owns all SQL against `staff_sessions`. One row per login; stores a
// sha256 hash of the refresh token so raw tokens are never persisted.
// Supports listing, refresh validation, revocation and freshness flags.
// ============================================================

import pool from "../db/index.js";

/** Create a session row on login. */
export const create = async ({
    staffId, refreshTokenHash, device, browser, ipAddress, expiresAt,
}) => {
    const { rows } = await pool.query(
        `INSERT INTO staff_sessions
            (staff_id, refresh_token_hash, device, browser, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, staff_id, device, browser, ip_address, login_at, expires_at, is_active`,
        [staffId, refreshTokenHash, device, browser, ipAddress, expiresAt]
    );
    return rows[0];
};

/** Find an active session by refresh-token hash (for refresh flow). */
export const findActiveByTokenHash = async (staffId, refreshTokenHash) => {
    const { rows } = await pool.query(
        `SELECT * FROM staff_sessions
         WHERE staff_id = $1
           AND refresh_token_hash = $2
           AND is_active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())
         LIMIT 1`,
        [staffId, refreshTokenHash]
    );
    return rows[0] || null;
};

/** Touch last_seen + clear the needs_refresh flag after a token refresh. */
export const touch = async (id) => {
    await pool.query(
        `UPDATE staff_sessions
         SET last_seen = NOW(), needs_refresh = FALSE
         WHERE id = $1`,
        [id]
    );
};

/** List a staff member's sessions (most recent first). */
export const listForStaff = async (staffId, { activeOnly = false } = {}) => {
    const { rows } = await pool.query(
        `SELECT id, staff_id, device, browser, ip_address,
                login_at, last_seen, expires_at, is_active, needs_refresh
         FROM staff_sessions
         WHERE staff_id = $1
           ${activeOnly ? "AND is_active = TRUE" : ""}
         ORDER BY login_at DESC`,
        [staffId]
    );
    return rows;
};

/** Revoke a single session (by id, scoped to a staff member). */
export const revokeById = async (staffId, sessionId) => {
    const { rows } = await pool.query(
        `UPDATE staff_sessions
         SET is_active = FALSE
         WHERE id = $1 AND staff_id = $2
         RETURNING id`,
        [sessionId, staffId]
    );
    return rows[0] || null;
};

/** Revoke a session by its refresh-token hash (logout). */
export const revokeByTokenHash = async (staffId, refreshTokenHash) => {
    const { rows } = await pool.query(
        `UPDATE staff_sessions
         SET is_active = FALSE
         WHERE staff_id = $1 AND refresh_token_hash = $2 AND is_active = TRUE
         RETURNING id`,
        [staffId, refreshTokenHash]
    );
    return rows[0] || null;
};

/** Revoke ALL active sessions for a staff member (disable/archive/delete). */
export const revokeAllForStaff = async (staffId) => {
    const { rowCount } = await pool.query(
        `UPDATE staff_sessions
         SET is_active = FALSE
         WHERE staff_id = $1 AND is_active = TRUE`,
        [staffId]
    );
    return rowCount;
};

/** Flag all active sessions of a role's members as needing a refresh (perms changed). */
export const flagNeedsRefreshByRole = async (roleId) => {
    const { rowCount } = await pool.query(
        `UPDATE staff_sessions s
         SET needs_refresh = TRUE
         FROM staff_users u
         WHERE s.staff_id = u.id
           AND u.role_id = $1
           AND s.is_active = TRUE`,
        [roleId]
    );
    return rowCount;
};

export default {
    create,
    findActiveByTokenHash,
    touch,
    listForStaff,
    revokeById,
    revokeByTokenHash,
    revokeAllForStaff,
    flagNeedsRefreshByRole,
};
