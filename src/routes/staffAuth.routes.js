// ============================================================
// Kisaan Kart — Staff Auth Routes
// ============================================================
// Phone + OTP authentication for staff (NO passwords).
//   Mounted at /api/staff/auth in app.js
// ============================================================

import express from "express";
import {
    sendOtp,
    resendOtp,
    verifyOtp,
    refreshToken,
    me,
    logout,
    updateProfileImage,
    deleteProfilePhoto,
    updateProfile,
    mySessions,
    revokeMySession,
    revokeAllOtherSessions,
    myLoginHistory,
    myAuditTimeline,
} from "../controllers/staffAuth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { otpSendLimiter, otpVerifyLimiter, authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// Public (pre-auth) OTP flow — rate limited
router.post("/send-otp",      otpSendLimiter,   sendOtp);
router.post("/resend-otp",    otpSendLimiter,   resendOtp);
router.post("/verify-otp",    otpVerifyLimiter,  verifyOtp);
router.post("/refresh-token", authLimiter,       refreshToken);

// Authenticated
router.get("/me",     verifyJWT, me);
router.post("/logout", verifyJWT, logout);
router.post("/profile-image", verifyJWT, upload.single("image"), updateProfileImage);
router.delete("/profile/photo", verifyJWT, deleteProfilePhoto);
router.put("/profile", verifyJWT, updateProfile);
router.get("/sessions", verifyJWT, mySessions);
router.delete("/sessions", verifyJWT, revokeAllOtherSessions);
router.delete("/sessions/:sessionId", verifyJWT, revokeMySession);
router.get("/login-history", verifyJWT, myLoginHistory);
router.get("/audit-timeline", verifyJWT, myAuditTimeline);

export default router;
