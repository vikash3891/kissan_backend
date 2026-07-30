// ============================================================
// Kisaan Kart — Role Admin Routes
// ============================================================
// Mounted at /api/admin/roles (all behind verifyJWT).
// ============================================================

import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";
import {
    listRoles, getRole, createRole, updateRole, updateRolePermissions, deleteRole,
} from "../controllers/role.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.patch("/:id/permissions", verifyPermission(PERMISSIONS.ROLES_UPDATE, PERMISSIONS.STAFF_PERMISSIONS), updateRolePermissions);

router.get(   "/",    verifyPermission(PERMISSIONS.ROLES_VIEW),   listRoles);
router.post(  "/",    verifyPermission(PERMISSIONS.ROLES_CREATE), createRole);
router.get(   "/:id", verifyPermission(PERMISSIONS.ROLES_VIEW),   getRole);
router.put(   "/:id", verifyPermission(PERMISSIONS.ROLES_UPDATE), updateRole);
router.delete("/:id", verifyPermission(PERMISSIONS.ROLES_DELETE), deleteRole);

export default router;
