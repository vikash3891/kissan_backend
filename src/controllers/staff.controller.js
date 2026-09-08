// ============================================================
// Kisaan Kart — Staff Admin Controller
// ============================================================
// HTTP layer for staff administration. Thin: parses input, delegates
// to staff.service, wraps in ApiResponse. Mounted at /api/admin/staff.
// ============================================================

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import staffService     from "../services/staff.service.js";

const toInt = (v, d) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? d : n;
};

// GET /api/admin/staff
export const listStaff = asyncHandler(async (req, res) => {
    const data = await staffService.list({
        page:    toInt(req.query.page, 1),
        limit:   toInt(req.query.limit, 20),
        search:  req.query.search || null,
        roleId:  req.query.role ? toInt(req.query.role, null) : null,
        status:  req.query.status || null,
        storeId: req.query.store ? toInt(req.query.store, null) : null,
    });
    return res.status(200).json(new ApiResponse(200, data, "Staff fetched"));
});

// GET /api/admin/staff/:id
export const getStaff = asyncHandler(async (req, res) => {
    const data = await staffService.getById(toInt(req.params.id));
    return res.status(200).json(new ApiResponse(200, data, "Staff fetched"));
});

// POST /api/admin/staff
export const createStaff = asyncHandler(async (req, res) => {
    const data = await staffService.create(req.body, req.user, req);
    return res.status(201).json(new ApiResponse(201, data, "Staff created"));
});

// PUT /api/admin/staff/:id
export const updateStaff = asyncHandler(async (req, res) => {
    const data = await staffService.update(toInt(req.params.id), req.body, req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Staff updated"));
});

// PATCH /api/admin/staff/:id/status  { is_active }
export const updateStatus = asyncHandler(async (req, res) => {
    const data = await staffService.setStatus(toInt(req.params.id), !!req.body.is_active, req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Staff status updated"));
});

// PATCH /api/admin/staff/:id/archive  { is_archived }
export const updateArchive = asyncHandler(async (req, res) => {
    const isArchived = req.body.is_archived === undefined ? true : !!req.body.is_archived;
    const data = await staffService.setArchived(toInt(req.params.id), isArchived, req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Staff archive state updated"));
});

// PATCH /api/admin/staff/:id/unlock
export const unlockStaff = asyncHandler(async (req, res) => {
    const data = await staffService.unlock(toInt(req.params.id), req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Staff unlocked"));
});

// DELETE /api/admin/staff/:id
export const deleteStaff = asyncHandler(async (req, res) => {
    const data = await staffService.remove(toInt(req.params.id), req.user, req);
    return res.status(200).json(new ApiResponse(200, data, "Staff permanently deleted"));
});

// GET /api/admin/staff/:id/sessions
export const listSessions = asyncHandler(async (req, res) => {
    const data = await staffService.listSessions(toInt(req.params.id));
    return res.status(200).json(new ApiResponse(200, data, "Sessions fetched"));
});

// DELETE /api/admin/staff/:id/sessions/:sid
export const revokeSession = asyncHandler(async (req, res) => {
    const data = await staffService.revokeSession(
        toInt(req.params.id), toInt(req.params.sid), req.user, req
    );
    return res.status(200).json(new ApiResponse(200, data, "Session revoked"));
});

export default {
    listStaff, getStaff, createStaff, updateStaff,
    updateStatus, updateArchive, unlockStaff, deleteStaff,
    listSessions, revokeSession,
};
