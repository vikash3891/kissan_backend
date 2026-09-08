import express from "express";


import {
    createBanner, getBanners, updateBanner,

    deleteBanner

} from "../controllers/banner.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { verifyPermission }
from "../middlewares/role.middleware.js";

import { PERMISSIONS }
from "../utils/roles.js";

import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();



// =====================================
// ADMIN — Banner CRUD
// =====================================

router.post(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.BANNER_MANAGE),
    upload.single("image"),
    createBanner
)

router.put(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.BANNER_MANAGE),
    upload.single("image"),
    updateBanner
)

router.delete(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.BANNER_MANAGE),
    deleteBanner
)

// =====================================
// PUBLIC — Customer endpoint
// =====================================

router.get(
    "/",
    getBanners
);

export default router;