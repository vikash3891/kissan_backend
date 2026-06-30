import express from "express";

import {

    addToWishlist,
    getWishlist,
    removeFromWishlist

}
from "../controllers/wishlist.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

const router = express.Router();



// =====================================
// ADD TO WISHLIST
// =====================================

router.post(

    "/:productId",

    verifyJWT,

    addToWishlist
);



// =====================================
// GET WISHLIST
// =====================================

router.get(

    "/",

    verifyJWT,

    getWishlist
);



// =====================================
// REMOVE WISHLIST
// =====================================

router.delete(

    "/:productId",

    verifyJWT,

    removeFromWishlist
);



export default router;