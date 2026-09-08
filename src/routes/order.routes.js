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

import { verifyPermission }
from "../middlewares/role.middleware.js";

import { PERMISSIONS }
from "../utils/roles.js";

const router = express.Router();



// =====================================
// CUSTOMER — Place Order
// =====================================

router.post(
    "/",
    verifyJWT,
    placeOrder
);



// =====================================
// CUSTOMER — Get My Orders
// =====================================

router.get(
    "/my",
    verifyJWT,
    getMyOrders
);



// =====================================
// CUSTOMER — Get Single Order
// =====================================

router.get(
    "/:id",
    verifyJWT,
    getSingleOrder
);



// =====================================
// CUSTOMER — Cancel Order
// =====================================

router.patch(
    "/cancel/:id",
    verifyJWT,
    cancelOrder
);



// =====================================
// CUSTOMER — Buy Now
// =====================================

router.post(
    "/buy-now",
    verifyJWT,
    buyNow
);

// =====================================
// ADMIN — Get All Orders
// =====================================

router.get(

    "/admin/all",

    verifyJWT,
    verifyPermission(PERMISSIONS.ORDERS_VIEW),

    getAllOrders
);



// =====================================
// ADMIN — Get Single Order
// =====================================

router.get(

    "/admin/:id",

    verifyJWT,
    verifyPermission(PERMISSIONS.ORDERS_VIEW),

    getAdminSingleOrder
);



// =====================================
// ADMIN — Update Order Status
// =====================================

router.patch(

    "/admin/status/:id",

    verifyJWT,
    verifyPermission(PERMISSIONS.ORDERS_UPDATE),

    updateOrderStatus
);

export default router;