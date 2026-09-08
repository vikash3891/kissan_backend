// ============================================================
// Kisaan Kart — Staff Dashboard Routes (enh #10)
// ============================================================
// Permission-aware dashboard. Any authenticated staff member
// can call this; the controller filters widgets by their perms.
// ============================================================

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getStaffDashboard } from "../controllers/staffDashboard.controller.js";

const router = Router();

// Any authenticated staff member can access — the controller
// filters widgets based on their JWT permissions.
router.get("/", verifyJWT, getStaffDashboard);

export default router;
