import express from "express";

import {

    sendOtp,

    verifyOtp,

    refreshAccessToken,

    getCurrentUser,
    logoutUser,
    getAllUsers

}
    from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";


const router = express.Router();


router.post(
    "/send-otp",
    sendOtp
);

router.post(
    "/verify-otp",
    verifyOtp
);

router.post(
    "/refresh-token",
    refreshAccessToken
);
router.get(
    "/me",
    verifyJWT,
    getCurrentUser
);
router.post(
    "/logout",
    verifyJWT,
    logoutUser
);
router.get(
    "/users",
    verifyJWT,
    verifyAdmin,
    getAllUsers
);
export default router;