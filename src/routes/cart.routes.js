import express from "express";

import {

    addToCart,

    getCart,

    updateCartQuantity,

    removeCartItem,

    clearCart

}
from "../controllers/cart.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

const router = express.Router();



// =====================================
// ADD TO CART
// =====================================

router.post(
    "/",
    verifyJWT,
    addToCart
);



// =====================================
// GET CART
// =====================================

router.get(
    "/",
    verifyJWT,
    getCart
);



// =====================================
// UPDATE QUANTITY
// =====================================

router.put(
    "/:id",
    verifyJWT,
    updateCartQuantity
);



// =====================================
// REMOVE ITEM
// =====================================

router.delete(
    "/:id",
    verifyJWT,
    removeCartItem
);



// =====================================
// CLEAR CART
// =====================================

router.delete(
    "/clear/all",
    verifyJWT,
    clearCart
);



export default router;