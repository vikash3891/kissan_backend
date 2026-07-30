import express from "express";

import {

    createCategory,

    getCategories,

    updateCategory,

    deleteCategory,

    getProductsByCategory,
    getSingleCategory,
    searchCategories,
    toggleCategoryStatus,
    getCategoryStats,
    reorderCategories

}
from "../controllers/category.controller.js";

import { verifyJWT, optionalAuth }
from "../middlewares/auth.middleware.js";

import { verifyPermission }
from "../middlewares/role.middleware.js";

import { PERMISSIONS }
from "../utils/roles.js";

import { upload }
from "../middlewares/multer.middleware.js";

const router = express.Router();



// =====================================
// ADMIN — Category CRUD
// =====================================

router.post(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_CREATE),
    upload.single("image"),
    createCategory
);

router.put(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_UPDATE),
    upload.single("image"),
    updateCategory
);

router.delete(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_DELETE),
    deleteCategory
);

router.patch(
    "/:id/status",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_UPDATE),
    toggleCategoryStatus
);

router.get(
    "/admin/stats",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_READ),
    getCategoryStats
);

router.patch(
    "/order",
    verifyJWT,
    verifyPermission(PERMISSIONS.CATEGORY_UPDATE),
    reorderCategories
);



// =====================================
// PUBLIC — Customer endpoints
// =====================================

router.get(
    "/",
    optionalAuth,
    getCategories
);

router.get(
    "/search",
    optionalAuth,
    searchCategories
);

router.get(
    "/:id",
    optionalAuth,
    getSingleCategory
);

router.get(
    "/:id/products",
    optionalAuth,
    getProductsByCategory
);

export default router;