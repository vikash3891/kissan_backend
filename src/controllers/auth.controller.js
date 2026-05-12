

import pool from "../db/index.js";
import jwt from "jsonwebtoken";
import generateOtp
from "../utils/generateOtp.js";

import hashOtp
from "../utils/hashOtp.js";

import {
    generateAccessToken,
    generateRefreshToken
}
from "../utils/token.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";




// SEND OTP
const sendOtp = asyncHandler(
async (req, res) => {

    const { phone } = req.body;
    // console.log(phone.le)

    // if(phone.length < 10 || length.phone > 15){

    //     throw new ApiError(
    //         400,
    //         "Phone no. length Must be between 10 and 15 digits"
    //     );
    // }

    if (!phone) {

        throw new ApiError(
            400,
            "Phone number is required"
        );
    }

    const otp = generateOtp();

    console.log(
        `OTP for ${phone}: ${otp}`
    );

    const otpHash = hashOtp(otp);

    const expiresAt =
        new Date(
            Date.now() + 5 * 60 * 1000
        );

    await pool.query(

        `
        INSERT INTO otp_codes
        (
            phone,
            otp_hash,
            expires_at
        )

        VALUES ($1, $2, $3)
        `,

        [
            phone,
            otpHash,
            expiresAt
        ]
    );

    return res.status(200).json(

        new ApiResponse(
            200,
            "OTP sent successfully"
        )
    );
});




// VERIFY OTP
const verifyOtp = asyncHandler(
async (req, res) => {

    const { phone, otp } = req.body;

    if (!phone || !otp) {

        throw new ApiError(
            400,
            "Phone and OTP required"
        );
    }

    const otpHash = hashOtp(otp);

    const result = await pool.query(

        `
        SELECT * FROM otp_codes

        WHERE phone = $1
        AND otp_hash = $2
        AND expires_at > NOW()

        ORDER BY created_at DESC

        LIMIT 1
        `,

        [phone, otpHash]
    );

    if (result.rows.length === 0) {

        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    let user = await pool.query(

        `
        SELECT * FROM users
        WHERE phone = $1
        `,

        [phone]
    );



    // CREATE USER
    if (user.rows.length === 0) {

        user = await pool.query(

            `
            INSERT INTO users (phone)

            VALUES ($1)

            RETURNING *
            `,

            [phone]
        );
    }

    const userData =
        user.rows[0];



    // TOKENS
    const accessToken =
        generateAccessToken(userData);

    const refreshToken =
        generateRefreshToken(userData);



    // SAVE REFRESH TOKEN
    await pool.query(

        `
        UPDATE users

        SET refresh_token = $1

        WHERE id = $2
        `,

        [
            refreshToken,
            userData.id
        ]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            "Login successful",

            {
                user: userData,
                accessToken,
                refreshToken
            }
        )
    );
});


const refreshAccessToken =
asyncHandler(async (req, res) => {

    const { refreshToken } =
        req.body;

    if (!refreshToken) {

        throw new ApiError(
            401,
            "Refresh token required"
        );
    }

    const decoded =
        jwt.verify(

            refreshToken,

            process.env
            .REFRESH_TOKEN_SECRET
        );



    const user = await pool.query(

        `
        SELECT * FROM users
        WHERE id = $1
        `,

        [decoded.id]
    );



    if (
        user.rows.length === 0
    ) {

        throw new ApiError(
            401,
            "Invalid refresh token"
        );
    }



    const dbUser =
        user.rows[0];



    if (
        dbUser.refresh_token
        !== refreshToken
    ) {

        throw new ApiError(
            401,
            "Refresh token mismatch"
        );
    }



    const accessToken =
        generateAccessToken(dbUser);



    return res.status(200).json(

        new ApiResponse(

            200,

            "Access token refreshed",

            {
                accessToken
            }
        )
    );
});




export {
    sendOtp,
    verifyOtp,
    refreshAccessToken,

};