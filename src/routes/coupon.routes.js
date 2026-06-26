import express from "express";

import {

    createCoupon,
    applyCoupon

}
from "../controllers/coupons.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { verifyAdmin }
from "../middlewares/admin.middleware.js";

const router = express.Router();



router.post(

    "/",

    verifyJWT,
    verifyAdmin,

    createCoupon
);



router.post(

    "/apply",

    verifyJWT,

    applyCoupon
);



export default router;