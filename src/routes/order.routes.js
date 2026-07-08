import express from "express";

import {

    placeOrder,

    getMyOrders,

    getSingleOrder,

    cancelOrder,
    getAllOrders,
    getAdminSingleOrder,
    updateOrderStatus,
    buyNow


}
from "../controllers/order.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";
import { verifyAdmin }
from "../middlewares/admin.middleware.js";

const router = express.Router();



// =====================================
// PLACE ORDER
// =====================================

router.post(
    "/",
    verifyJWT,
    placeOrder
);



// =====================================
// GET MY ORDERS
// =====================================

router.get(
    "/my",
    verifyJWT,
    getMyOrders
);



// =====================================
// GET SINGLE ORDER
// =====================================

router.get(
    "/:id",
    verifyJWT,
    getSingleOrder
);



// =====================================
// CANCEL ORDER
// =====================================

router.patch(
    "/cancel/:id",
    verifyJWT,
    cancelOrder
);



// =====================================
// Buy now 
// =====================================

router.post(
    "/buy-now",
    verifyJWT,
    buyNow
);

// =====================================
// ADMIN - GET ALL ORDERS
// =====================================

router.get(

    "/admin/all",

    verifyJWT,
    verifyAdmin,

    getAllOrders
);



// =====================================
// ADMIN - GET SINGLE ORDER
// =====================================

router.get(

    "/admin/:id",

    verifyJWT,
    verifyAdmin,

    getAdminSingleOrder
);



// =====================================
// ADMIN - UPDATE STATUS
// =====================================

router.patch(

    "/admin/status/:id",

    verifyJWT,
    verifyAdmin,

    updateOrderStatus
);

export default router;