// ============================================================
// Kisaan Kart — Permission / Store / Activity-Log Admin Controller
// ============================================================
// Lightweight read-mostly endpoints supporting the Staff Management UI:
//   • GET /api/admin/permissions   → module-grouped catalog (enh #11)
//   • GET /api/admin/stores        → store dropdown (enh #1)
//   • POST /api/admin/stores       → create store
//   • GET /api/admin/activity-logs → audit trail (enh #10)
// ============================================================

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { ApiError }     from "../utils/ApiError.js";
import permissionRepo   from "../repositories/permission.repository.js";
import storeRepo        from "../repositories/store.repository.js";
import activityLog      from "../services/activityLog.service.js";

const toInt = (v, d) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? d : n;
};

// ─── Permissions ────────────────────────────────────────────
// GET /api/admin/permissions
export const listPermissions = asyncHandler(async (_req, res) => {
    const grouped = await permissionRepo.listGrouped();
    return res.status(200).json(new ApiResponse(200, grouped, "Permissions fetched"));
});

// ─── Stores ─────────────────────────────────────────────────
// GET /api/admin/stores
export const listStores = asyncHandler(async (req, res) => {
    const data = await storeRepo.list({ activeOnly: req.query.active === "true" });
    return res.status(200).json(new ApiResponse(200, data, "Stores fetched"));
});

// POST /api/admin/stores
export const createStore = asyncHandler(async (req, res) => {
    const { name, address } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "Store name is required");
    const data = await storeRepo.create({ name: name.trim(), address });
    await activityLog.recordFromReq(req, {
        staffId: req.user?.id, action: "STORE_CREATED", module: "stores",
        entity: "store", entityId: data.id, newValue: { name: data.name },
    });
    return res.status(201).json(new ApiResponse(201, data, "Store created"));
});

// ─── Activity logs ──────────────────────────────────────────
// GET /api/admin/activity-logs
export const listActivityLogs = asyncHandler(async (req, res) => {
    const data = await activityLog.list({
        page:    toInt(req.query.page, 1),
        limit:   toInt(req.query.limit, 20),
        search:  req.query.search || null,
        staffId: req.query.staff_id ? toInt(req.query.staff_id, null) : null,
        action:  req.query.action || null,
        from:    req.query.from || null,
        to:      req.query.to || null,
    });
    return res.status(200).json(new ApiResponse(200, data, "Activity logs fetched"));
});

export default { listPermissions, listStores, createStore, listActivityLogs };
