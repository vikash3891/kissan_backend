import express from "express";


import {
    createBanner,getBanners,updateBanner,

    deleteBanner

} from "../controllers/banner.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { verifyAdmin }
from "../middlewares/admin.middleware.js";

const router = express.Router();



router.post(
    "/",
    verifyJWT,
    verifyAdmin,
    createBanner
)


router.put(
    "/:id",
    verifyJWT,
    verifyAdmin,
    updateBanner
)

router.delete(
    "/:id",
    verifyJWT,
    verifyAdmin,
    deleteBanner
)

// =====================================
// PUBLIC ROUTE
// =====================================

router.get(
    "/",
    getBanners
);

export default router;