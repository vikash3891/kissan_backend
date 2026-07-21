import express from "express";


import {
    createBanner, getBanners, updateBanner,

    deleteBanner

} from "../controllers/banner.controller.js";

import { verifyJWT }
    from "../middlewares/auth.middleware.js";

import { verifyAdmin }
    from "../middlewares/admin.middleware.js";

import { upload }
    from "../middlewares/multer.middleware.js";

const router = express.Router();



router.post(
    "/",
    verifyJWT,
    verifyAdmin,
    upload.single("image"),
    createBanner
)


router.put(
    "/:id",
    verifyJWT,
    verifyAdmin,
    upload.single("image"),
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