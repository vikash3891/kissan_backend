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

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { verifyAdmin }
from "../middlewares/admin.middleware.js";
import { upload }
from "../middlewares/multer.middleware.js";

const router = express.Router();



// ADMIN
router.post(
    "/",
    verifyJWT,
    verifyAdmin,
    upload.single("image"),
    createCategory
);

router.put(
    "/:id",
    verifyJWT,
    verifyAdmin,
    upload.single("image"),
    updateCategory
);

router.delete(
    "/:id",
    verifyJWT,
    verifyAdmin,
    deleteCategory
);



// CUSTOMER
router.get(
    "/",
    getCategories
);

router.get(
    "/:id/products",
    getProductsByCategory
);




router.get("/search", searchCategories);
router.get("/:id", getSingleCategory);

// Admin
router.patch(
    "/:id/status",
    verifyJWT,
    verifyAdmin,
    toggleCategoryStatus
);

router.get(
    "/admin/stats",
    verifyJWT,
    verifyAdmin,
    getCategoryStats
);

router.patch(
    "/order",
    verifyJWT,
    verifyAdmin,
    reorderCategories
);
export default router;