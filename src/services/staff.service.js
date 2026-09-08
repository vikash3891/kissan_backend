// ============================================================
// Kisaan Kart — Staff Service
// ============================================================
// Business rules for staff administration (CRUD + lifecycle).
// Enforces privilege escalation guards (enh #9), emits domain events
// (enh #13) and writes before/after audit entries (enh #10).
// ============================================================

import staffRepo        from "../repositories/staff.repository.js";
import roleRepo         from "../repositories/role.repository.js";
import staffSessionRepo from "../repositories/staffSession.repository.js";
import { ApiError }     from "../utils/ApiError.js";
import { ROLES, roleSlug } from "../utils/roles.js";
import { eventBus, EVENTS } from "./events/eventBus.js";
import activityLog          from "./activityLog.service.js";

// Assigning these roles is restricted to super_admin.
const PRIVILEGED_ROLE_SLUGS = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

// ─── Mappers ────────────────────────────────────────────────
const deriveStatus = (s) => {
    if (s.is_archived) return "archived";
    if (!s.is_active)  return "disabled";
    if (s.locked_until && new Date(s.locked_until) > new Date()) return "locked";
    if (s.is_invited)  return "invited";
    if (!s.last_login) return "never_logged_in";
    return "active";
};

const toDTO = (s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    roleId: s.role_id,
    roleName: s.role_name,
    storeId: s.store_id,
    storeName: s.store_name,
    profileImage: s.profile_image,
    designation: s.designation,
    department: s.department,
    employeeId: s.employee_id,
    notes: s.notes,
    isActive: s.is_active,
    isArchived: s.is_archived,
    isInvited: s.is_invited,
    isLocked: !!(s.locked_until && new Date(s.locked_until) > new Date()),
    lockedUntil: s.locked_until,
    status: deriveStatus(s),
    firstLoginAt: s.first_login_at,
    lastLogin: s.last_login,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
});

// ─── Guards ─────────────────────────────────────────────────
const isSuperAdmin = (actor) => actor?.role === ROLES.SUPER_ADMIN;

/** Only super_admin may create/assign Admin or Super Admin roles. */
const assertMayAssignRole = async (actor, roleId) => {
    if (!roleId) return;
    const role = await roleRepo.findById(roleId);
    if (!role) throw new ApiError(400, "Invalid role");
    if (PRIVILEGED_ROLE_SLUGS.has(roleSlug(role.name)) && !isSuperAdmin(actor)) {
        throw new ApiError(403, "Only a Super Admin can assign Admin or Super Admin roles");
    }
    return role;
};

// ─── Queries ────────────────────────────────────────────────
export const list = async (filters) => {
    const result = await staffRepo.list(filters);
    return { ...result, items: result.items.map(toDTO) };
};

export const getById = async (id) => {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new ApiError(404, "Staff not found");
    return toDTO(staff);
};

// ─── Create ─────────────────────────────────────────────────
export const create = async (payload, actor, req) => {
    if (!payload.name)  throw new ApiError(400, "Name is required");
    if (!payload.phone) throw new ApiError(400, "Phone is required");
    if (payload.phone.length < 10 || payload.phone.length > 15) {
        throw new ApiError(400, "Phone number must be 10–15 digits");
    }

    const existing = await staffRepo.findByPhone(payload.phone);
    if (existing) throw new ApiError(409, "A staff member with this phone already exists");

    await assertMayAssignRole(actor, payload.role_id);

    const created = await staffRepo.create(payload);

    eventBus.emitEvent(EVENTS.STAFF_CREATED, { staffId: created.id, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "STAFF_CREATED", module: "staff",
        entity: "staff", entityId: created.id, newValue: toDTO(created),
    });
    return toDTO(created);
};

// ─── Update ─────────────────────────────────────────────────
export const update = async (id, payload, actor, req) => {
    const before = await staffRepo.findById(id);
    if (!before) throw new ApiError(404, "Staff not found");

    // Guard both the current and the target (new) role.
    if (PRIVILEGED_ROLE_SLUGS.has(roleSlug(before.role_name)) && !isSuperAdmin(actor)) {
        throw new ApiError(403, "Only a Super Admin can modify an Admin or Super Admin account");
    }
    if (payload.role_id !== undefined && payload.role_id !== before.role_id) {
        await assertMayAssignRole(actor, payload.role_id);
    }

    const after = await staffRepo.update(id, payload);

    if (payload.role_id !== undefined && payload.role_id !== before.role_id) {
        eventBus.emitEvent(EVENTS.STAFF_ROLE_CHANGED, { staffId: id, from: before.role_id, to: payload.role_id, by: actor?.id });
        // A role change alters the member's permission set → force refresh.
        await staffSessionRepo.revokeAllForStaff(id);
    }

    eventBus.emitEvent(EVENTS.STAFF_UPDATED, { staffId: id, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "STAFF_UPDATED", module: "staff",
        entity: "staff", entityId: id, oldValue: toDTO(before), newValue: toDTO(after),
    });
    return toDTO(after);
};

// ─── Status / Archive / Unlock ──────────────────────────────
export const setStatus = async (id, isActive, actor, req) => {
    const before = await staffRepo.findById(id);
    if (!before) throw new ApiError(404, "Staff not found");
    if (PRIVILEGED_ROLE_SLUGS.has(roleSlug(before.role_name)) && !isSuperAdmin(actor)) {
        throw new ApiError(403, "Only a Super Admin can change an Admin or Super Admin account");
    }

    const after = await staffRepo.setStatus(id, isActive);
    if (!isActive) await staffSessionRepo.revokeAllForStaff(id); // disabling logs them out

    eventBus.emitEvent(EVENTS.STAFF_STATUS_CHANGED, { staffId: id, isActive, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: isActive ? "STAFF_ENABLED" : "STAFF_DISABLED",
        module: "staff", entity: "staff", entityId: id,
        oldValue: { is_active: before.is_active }, newValue: { is_active: isActive },
    });
    return toDTO(after);
};

export const setArchived = async (id, isArchived, actor, req) => {
    const before = await staffRepo.findById(id);
    if (!before) throw new ApiError(404, "Staff not found");
    if (PRIVILEGED_ROLE_SLUGS.has(roleSlug(before.role_name)) && !isSuperAdmin(actor)) {
        throw new ApiError(403, "Only a Super Admin can archive an Admin or Super Admin account");
    }

    const after = await staffRepo.setArchived(id, isArchived);
    if (isArchived) await staffSessionRepo.revokeAllForStaff(id);

    eventBus.emitEvent(EVENTS.STAFF_ARCHIVED, { staffId: id, isArchived, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: isArchived ? "STAFF_ARCHIVED" : "STAFF_RESTORED",
        module: "staff", entity: "staff", entityId: id,
        oldValue: { is_archived: before.is_archived }, newValue: { is_archived: isArchived },
    });
    return toDTO(after);
};

export const unlock = async (id, actor, req) => {
    const before = await staffRepo.findById(id);
    if (!before) throw new ApiError(404, "Staff not found");

    await staffRepo.unlock(id);
    eventBus.emitEvent(EVENTS.STAFF_UNLOCKED, { staffId: id, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "STAFF_UNLOCKED", module: "staff",
        entity: "staff", entityId: id, oldValue: { locked_until: before.locked_until },
    });
    return await getById(id);
};

// ─── Permanent delete (super_admin only) ────────────────────
export const remove = async (id, actor, req) => {
    if (!isSuperAdmin(actor)) {
        throw new ApiError(403, "Only a Super Admin can permanently delete staff");
    }
    const before = await staffRepo.findById(id);
    if (!before) throw new ApiError(404, "Staff not found");
    if (before.id === actor.id) {
        throw new ApiError(400, "You cannot delete your own account");
    }

    await staffSessionRepo.revokeAllForStaff(id);
    await staffRepo.remove(id);

    eventBus.emitEvent(EVENTS.STAFF_DELETED, { staffId: id, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "STAFF_DELETED", module: "staff",
        entity: "staff", entityId: id, oldValue: toDTO(before),
    });
    return { id };
};

// ─── Sessions ───────────────────────────────────────────────
export const listSessions = async (staffId) => {
    const staff = await staffRepo.findById(staffId);
    if (!staff) throw new ApiError(404, "Staff not found");
    return await staffSessionRepo.listForStaff(staffId);
};

export const revokeSession = async (staffId, sessionId, actor, req) => {
    const revoked = await staffSessionRepo.revokeById(staffId, sessionId);
    if (!revoked) throw new ApiError(404, "Session not found");

    eventBus.emitEvent(EVENTS.SESSION_REVOKED, { staffId, sessionId, by: actor?.id });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "SESSION_REVOKED", module: "sessions",
        entity: "staff_session", entityId: sessionId, newValue: { staff_id: staffId },
    });
    return { id: sessionId };
};

export default {
    list, getById, create, update,
    setStatus, setArchived, unlock, remove,
    listSessions, revokeSession,
};
