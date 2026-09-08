// ============================================================
// Kisaan Kart — Staff Auth Controller
// ============================================================
// Thin HTTP layer over staffAuth.service. Reuses the shared
// ApiResponse / ApiError / asyncHandler conventions.
//   Mounted at /api/staff/auth
// ============================================================

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { ApiError }     from "../utils/ApiError.js";
import staffAuth        from "../services/staffAuth.service.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// POST /send-otp
export const sendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    const data = await staffAuth.sendOtp(phone, req);
    return res.status(200).json(new ApiResponse(200, data, data.message));
});

// POST /resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    const data = await staffAuth.resendOtp(phone, req);
    return res.status(200).json(new ApiResponse(200, data, data.message));
});

// POST /verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;
    const data = await staffAuth.verifyOtp(phone, otp, req);
    return res.status(200).json(new ApiResponse(200, data, "Login successful"));
});

// POST /refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const data = await staffAuth.refreshToken(refreshToken, req);
    return res.status(200).json(new ApiResponse(200, data, "Access token refreshed"));
});

// GET /me  (auth)
export const me = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") {
        throw new ApiError(403, "Staff token required");
    }
    const data = await staffAuth.me(req.user.id);
    return res.status(200).json(new ApiResponse(200, data, "Current staff fetched"));
});

// POST /logout  (auth)
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};
    const data = await staffAuth.logout(req.user.id, refreshToken, req);
    return res.status(200).json(new ApiResponse(200, data, data.message));
});

// POST /profile-image
export const updateProfileImage = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") {
        throw new ApiError(403, "Staff token required");
    }
    const imageLocalPath = req.file?.path;
    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required");
    }

    const uploadedImage = await uploadOnCloudinary(imageLocalPath);
    if (!uploadedImage) {
        throw new ApiError(500, "Image upload failed");
    }
    
    // Clean up local file
    if (fs.existsSync(imageLocalPath)) {
        fs.unlinkSync(imageLocalPath);
    }

    const data = await staffAuth.updateProfileImage(req.user.id, uploadedImage.secure_url, req);
    return res.status(200).json(new ApiResponse(200, data, "Profile image updated successfully"));
});

export const deleteProfilePhoto = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const data = await staffAuth.updateProfileImage(req.user.id, null, req);
    return res.status(200).json(new ApiResponse(200, data, "Profile photo deleted successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const { name, email, phone, dob, gender } = req.body;
    const data = await staffAuth.updateProfile(req.user.id, { name, email, phone, dob, gender }, req);
    return res.status(200).json(new ApiResponse(200, data, "Profile updated successfully"));
});

export const mySessions = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const data = await staffAuth.mySessions(req.user.id);
    return res.status(200).json(new ApiResponse(200, data, "Sessions fetched successfully"));
});

export const revokeMySession = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const { sessionId } = req.params;
    const data = await staffAuth.revokeMySession(req.user.id, sessionId, req);
    return res.status(200).json(new ApiResponse(200, data, "Session revoked successfully"));
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const { currentSessionId } = req.body;
    const data = await staffAuth.revokeAllOtherSessions(req.user.id, currentSessionId, req);
    return res.status(200).json(new ApiResponse(200, data, "Other sessions revoked successfully"));
});

export const myLoginHistory = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const data = await staffAuth.myLoginHistory(req.user.id);
    return res.status(200).json(new ApiResponse(200, data, "Login history fetched successfully"));
});

export const myAuditTimeline = asyncHandler(async (req, res) => {
    if (req.user?.type !== "staff") throw new ApiError(403, "Staff token required");
    const data = await staffAuth.myAuditTimeline(req.user.id);
    return res.status(200).json(new ApiResponse(200, data, "Audit timeline fetched successfully"));
});

export default { 
    sendOtp, resendOtp, verifyOtp, refreshToken, me, logout, updateProfileImage,
    deleteProfilePhoto, updateProfile, mySessions, revokeMySession, revokeAllOtherSessions,
    myLoginHistory, myAuditTimeline
};
