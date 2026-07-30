// ============================================================
// Kisaan Kart — Role Admin Controller
// ============================================================
// HTTP layer for role management. Mounted at /api/admin/roles.
// ============================================================

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import roleService      from "../services/role.service.js";

const toInt = (v) => parseInt(v, 10);

// GET /api/admin/roles
export const listRoles = asyncHandler(async (req, res) => {
    const data = await roleService.list();
    return res.status(200).json(new ApiResponse(200, data, "Roles fetched"));
});

// GET /api/admin/roles/:id
export const getRole = asyncHandler(async (req, res) => {
    const data = await roleService.getById(toInt(req.params.id));
    return res.status(200).json(new ApiResponse(200, data, "Role fetched"));
});

// POST /api/admin/roles
export const createRole = asyncHandler(async (req, res) => {
    const data = await roleService.create(req.body, req.user, req);
    return res.status(201).json(new ApiResponse(201, data, "Role created"));
});

// PUT /api/admin/roles/:id
export const updateRole = asyncHandler(async (req, res) => {
    const data = await roleService.update(toInt(req.params.id), req.body, req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Role updated"));
});

// PATCH /api/admin/roles/:id/permissions  { permission_ids: [] }
export const updateRolePermissions = asyncHandler(async (req, res) => {
    const data = await roleService.setPermissions(
        toInt(req.params.id), req.body.permission_ids || [], req.user, req
    );
    return res.status(200).json(new ApiResponse(200, data, "Role permissions updated"));
});

// DELETE /api/admin/roles/:id
export const deleteRole = asyncHandler(async (req, res) => {
    const data = await roleService.remove(toInt(req.params.id), req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Role deleted"));
});

export default {
    listRoles, getRole, createRole, updateRole, updateRolePermissions, deleteRole,
};
