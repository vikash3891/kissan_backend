// ============================================================
// Kisaan Kart — Staff Admin Routes
// ============================================================
// Mounted at /api/admin/staff (all behind verifyJWT).
// ============================================================

import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission, requireSuperAdmin } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";
import {
    listStaff, getStaff, createStaff, updateStaff,
    updateStatus, updateArchive, unlockStaff, deleteStaff,
    listSessions, revokeSession,
} from "../controllers/staff.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Sessions (more specific paths first)
router.get(   "/:id/sessions",       verifyPermission(PERMISSIONS.SESSIONS_VIEW),   listSessions);
router.delete("/:id/sessions/:sid",  verifyPermission(PERMISSIONS.SESSIONS_REVOKE), revokeSession);

// Lifecycle
router.patch( "/:id/status",  verifyPermission(PERMISSIONS.STAFF_UPDATE), updateStatus);
router.patch( "/:id/archive", verifyPermission(PERMISSIONS.STAFF_UPDATE), updateArchive);
router.patch( "/:id/unlock",  verifyPermission(PERMISSIONS.STAFF_UPDATE), unlockStaff);

// CRUD
router.get(   "/",     verifyPermission(PERMISSIONS.STAFF_VIEW),   listStaff);
router.post(  "/",     verifyPermission(PERMISSIONS.STAFF_CREATE), createStaff);
router.get(   "/:id",  verifyPermission(PERMISSIONS.STAFF_VIEW),   getStaff);
router.put(   "/:id",  verifyPermission(PERMISSIONS.STAFF_UPDATE), updateStaff);

// Permanent delete — super_admin only (service double-checks).
router.delete("/:id",  requireSuperAdmin, verifyPermission(PERMISSIONS.STAFF_DELETE), deleteStaff);

export default router;
