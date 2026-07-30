// ============================================================
// Kisaan Kart — Permission / Store / Activity-Log Admin Routes
// ============================================================
// Mounted at /api/admin (all behind verifyJWT):
//   GET  /permissions
//   GET  /stores        POST /stores
//   GET  /activity-logs
// ============================================================

import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";
import {
    listPermissions, listStores, createStore, listActivityLogs,
} from "../controllers/rbacAdmin.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Permissions catalog — needed by anyone who can view roles or assign staff perms.
router.get("/permissions",
    verifyPermission(PERMISSIONS.ROLES_VIEW, PERMISSIONS.STAFF_PERMISSIONS, PERMISSIONS.STAFF_VIEW),
    listPermissions);

// Stores
router.get( "/stores", verifyPermission(PERMISSIONS.STORES_VIEW, PERMISSIONS.STAFF_VIEW), listStores);
router.post("/stores", verifyPermission(PERMISSIONS.STORES_MANAGE), createStore);

// Activity logs
router.get("/activity-logs", verifyPermission(PERMISSIONS.STAFF_VIEW, PERMISSIONS.REPORTS_VIEW), listActivityLogs);

export default router;
