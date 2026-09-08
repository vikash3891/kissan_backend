import express from "express";
import { getAllUsers, getSingleUser, updateUserRole, getUserStats } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";

const router = express.Router();

// Stats endpoint must come before /:id param route
router.get("/stats", verifyJWT, verifyPermission(PERMISSIONS.USERS_VIEW), getUserStats);
router.get("/", verifyJWT, verifyPermission(PERMISSIONS.USERS_VIEW), getAllUsers);
router.get("/:id", verifyJWT, verifyPermission(PERMISSIONS.USERS_VIEW), getSingleUser);
router.patch("/:id/role", verifyJWT, verifyPermission(PERMISSIONS.USERS_MANAGE), updateUserRole);

export default router;
