import express from "express";

import {
    createCoupon,
    applyCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    toggleCoupon
}
from "../controllers/coupons.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { verifyPermission }
from "../middlewares/role.middleware.js";

import { PERMISSIONS }
from "../utils/roles.js";

const router = express.Router();



// =====================================
// ADMIN — Coupon Management
// =====================================

router.post(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.COUPONS_MANAGE),
    createCoupon
);

router.get(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.COUPONS_MANAGE),
    getAllCoupons
);

router.put(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.COUPONS_MANAGE),
    updateCoupon
);

router.delete(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.COUPONS_MANAGE),
    deleteCoupon
);

router.patch(
    "/:id/toggle",
    verifyJWT,
    verifyPermission(PERMISSIONS.COUPONS_MANAGE),
    toggleCoupon
);



// =====================================
// CUSTOMER — Apply Coupon
// =====================================

router.post(
    "/apply",
    verifyJWT,
    applyCoupon
);

export default router;