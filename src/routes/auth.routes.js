import express from "express";

import {

    sendOtp,

    verifyOtp,

    refreshAccessToken

}
from "../controllers/auth.controller.js";

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

export default router;