import express from "express";
import { verifyAdmin }
from "../middlewares/admin.middleware.js";
import {

    createProduct,

    getAllProducts,

    getSingleProduct,

    updateProduct,

    deleteProduct

}
from "../controllers/products.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";
import { upload }
from "../middlewares/multer.middleware.js";

const router = express.Router();



// ADMIN
router.post(
    "/",
    verifyJWT,
    verifyAdmin,
    upload.single("image"),

    createProduct
);

router.put(
    "/:id",
    verifyJWT,
    verifyAdmin,
    updateProduct
);

router.delete(
    "/:id",
    verifyJWT,
    verifyAdmin,
    deleteProduct
);



// CUSTOMER
router.get(
    "/",
    getAllProducts
);

router.get(
    "/:id",
    getSingleProduct
);

export default router;