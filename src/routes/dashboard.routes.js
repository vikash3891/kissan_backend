import express from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";

const router = express.Router();

router.get(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.DASHBOARD_VIEW),
    getDashboard
);

export default router;
