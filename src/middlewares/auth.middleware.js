import jwt from "jsonwebtoken";

import { ApiError }
from "../utils/ApiError.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



const verifyJWT = asyncHandler(
async (req, _, next) => {

    const token =
        req.header("Authorization")
        ?.replace("Bearer ", "");

    if (!token) {

        throw new ApiError(
            401,
            "Unauthorized request"
        );
    }

    const decoded =
        jwt.verify(

            token,

            process.env
            .ACCESS_TOKEN_SECRET
        );

    req.user = decoded;

    next();
});

const optionalAuth = asyncHandler(async (req, _, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
    } catch (error) {
        // Ignore token errors for optional auth
    }
    next();
});

export { verifyJWT, optionalAuth };