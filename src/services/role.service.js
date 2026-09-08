// ============================================================
// Kisaan Kart — Role Service
// ============================================================
// Business rules for role management. Custom roles can be created and
// edited; system roles (is_system=true) are protected. Permission edits
// bump the role version and flag affected sessions for refresh
// (enh #6/#7) without forcing a logout.
// ============================================================

import roleRepo         from "../repositories/role.repository.js";
import permissionRepo   from "../repositories/permission.repository.js";
import staffRepo        from "../repositories/staff.repository.js";
import staffSessionRepo from "../repositories/staffSession.repository.js";
import { ApiError }     from "../utils/ApiError.js";
import { eventBus, EVENTS } from "./events/eventBus.js";
import activityLog          from "./activityLog.service.js";

const toDTO = (r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.is_system,
    isActive: r.is_active,
    storeId: r.store_id,
    permissionsVersion: r.permissions_version,
    permissionCount: r.permission_count,
    staffCount: r.staff_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
});

// ─── Queries ────────────────────────────────────────────────
export const list = async () => {
    const rows = await roleRepo.list();
    return rows.map(toDTO);
};

export const getById = async (id) => {
    const role = await roleRepo.findById(id);
    if (!role) throw new ApiError(404, "Role not found");
    const permissions = await roleRepo.getPermissions(id);
    return { ...toDTO(role), permissions };
};

// ─── Validate a set of permission ids ───────────────────────
const validatePermissionIds = async (permissionIds = []) => {
    const ids = [...new Set(permissionIds.map(Number).filter(Boolean))];
    const existing = await permissionRepo.findExistingIds(ids);
    if (existing.length !== ids.length) {
        throw new ApiError(400, "One or more permission ids are invalid");
    }
    return existing;
};

// ─── Create ─────────────────────────────────────────────────
export const create = async ({ name, description, store_id, permission_ids }, actor, req) => {
    if (!name || !name.trim()) throw new ApiError(400, "Role name is required");

    const dup = await roleRepo.findByName(name.trim());
    if (dup) throw new ApiError(409, "A role with this name already exists");

    const permissionIds = await validatePermissionIds(permission_ids);
    const role = await roleRepo.create({
        name: name.trim(), description, storeId: store_id ?? null, permissionIds,
    });

    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "ROLE_CREATED", module: "roles",
        entity: "role", entityId: role.id, newValue: { name: role.name, permission_ids: permissionIds },
    });
    return await getById(role.id);
};

// ─── Update metadata ────────────────────────────────────────
export const update = async (id, payload, actor, req) => {
    const before = await roleRepo.findById(id);
    if (!before) throw new ApiError(404, "Role not found");
    if (before.is_system && payload.name && payload.name !== before.name) {
        throw new ApiError(403, "System role names cannot be changed");
    }
    if (payload.name && payload.name.trim() !== before.name) {
        const dup = await roleRepo.findByName(payload.name.trim());
        if (dup) throw new ApiError(409, "A role with this name already exists");
    }

    const after = await roleRepo.update(id, {
        name: payload.name?.trim(), description: payload.description, is_active: payload.is_active,
    });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "ROLE_UPDATED", module: "roles",
        entity: "role", entityId: id,
        oldValue: { name: before.name, description: before.description },
        newValue: { name: after.name, description: after.description },
    });
    return await getById(id);
};

// ─── Replace permissions (bump version + flag sessions) ─────
export const setPermissions = async (id, permission_ids, actor, req) => {
    const role = await roleRepo.findById(id);
    if (!role) throw new ApiError(404, "Role not found");

    const before = await roleRepo.getPermissions(id);
    const permissionIds = await validatePermissionIds(permission_ids);

    const newVersion = await roleRepo.setPermissions(id, permissionIds);
    const flagged = await staffSessionRepo.flagNeedsRefreshByRole(id);

    eventBus.emitEvent(EVENTS.ROLE_PERMISSIONS_CHANGED, {
        roleId: id, version: newVersion, sessionsFlagged: flagged, by: actor?.id,
    });
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "ROLE_PERMISSIONS_CHANGED", module: "roles",
        entity: "role", entityId: id,
        oldValue: { permission_ids: before.map(p => p.id) },
        newValue: { permission_ids: permissionIds, permissions_version: newVersion },
    });
    return await getById(id);
};

// ─── Delete (block system / in-use) ─────────────────────────
export const remove = async (id, actor, req) => {
    const role = await roleRepo.findById(id);
    if (!role) throw new ApiError(404, "Role not found");
    if (role.is_system) throw new ApiError(403, "System roles cannot be deleted");

    const inUse = await staffRepo.countByRole(id);
    if (inUse > 0) {
        throw new ApiError(409, `Role is assigned to ${inUse} staff member(s); reassign them first`);
    }

    await roleRepo.remove(id);
    await activityLog.recordFromReq(req, {
        staffId: actor?.id, action: "ROLE_DELETED", module: "roles",
        entity: "role", entityId: id, oldValue: { name: role.name },
    });
    return { id };
};

export default { list, getById, create, update, setPermissions, remove };
