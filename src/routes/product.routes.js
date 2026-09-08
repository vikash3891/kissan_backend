import express from "express";
import { verifyJWT, optionalAuth }
from "../middlewares/auth.middleware.js";
import { verifyPermission }
from "../middlewares/role.middleware.js";
import { PERMISSIONS }
from "../utils/roles.js";

import {

    createProduct,

    getAllProducts,

    getSingleProduct,

    updateProduct,
    toggleProductStatus,
    deleteProduct,
    updateStock,
    getInventory

}
from "../controllers/products.controller.js";

import { upload }
from "../middlewares/multer.middleware.js";

const router = express.Router();



// =====================================
// ADMIN — Product CRUD
// =====================================

router.post(
    "/",
    verifyJWT,
    verifyPermission(PERMISSIONS.PRODUCT_CREATE),
    upload.single("image"),
    createProduct
);

router.put(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.PRODUCT_UPDATE),
    upload.single("image"),
    updateProduct
);

router.delete(
    "/:id",
    verifyJWT,
    verifyPermission(PERMISSIONS.PRODUCT_DELETE),
    deleteProduct
);

router.patch(
    "/:id/stock",
    verifyJWT,
    verifyPermission(PERMISSIONS.INVENTORY_UPDATE),
    updateStock
);

router.patch(
    "/:id/status",
    verifyJWT,
    verifyPermission(PERMISSIONS.PRODUCT_UPDATE),
    toggleProductStatus
);

router.get(
    "/inventory",
    verifyJWT,
    verifyPermission(PERMISSIONS.INVENTORY_VIEW),
    getInventory
);



// =====================================
// PUBLIC — Customer endpoints
// =====================================

router.get(
    "/",
    optionalAuth,
    getAllProducts
);

router.get(
    "/:id",
    optionalAuth,
    getSingleProduct
);

export default router;