import fs from "fs";
import pool from "../db/index.js";

import { ApiError }
    from "../utils/ApiError.js";

import { ApiResponse }
    from "../utils/ApiResponse.js";

import { asyncHandler }
    from "../utils/asyncHandler.js";

import { uploadOnCloudinary }
    from "../utils/cloudinary.js";


// =====================================
// CREATE BANNER
// =====================================

const createBanner = asyncHandler(
    async (req, res) => {

        const {

            title,
            image_url,
            redirect_type,
            redirect_id,
            is_active

        } = req.body;

        let imageUrl = image_url;
        const imageLocalPath = req.file?.path;

        if (imageLocalPath) {
            const uploadedImage = await uploadOnCloudinary(imageLocalPath);
            if (uploadedImage) {
                imageUrl = uploadedImage.secure_url;
                fs.unlinkSync(imageLocalPath);
            }
        }

        if (!imageUrl) {

            throw new ApiError(
                400,
                "Banner image required"
            );
        }



        const result =
            await pool.query(

                `
        INSERT INTO banners
        (

            title,
            image_url,
            redirect_type,
            redirect_id,
            is_active

        )

        VALUES ($1,$2,$3,$4,$5)

        RETURNING *
        `,

                [

                    title,
                    imageUrl,
                    redirect_type,
                    redirect_id,
                    is_active ?? true
                ]
            );



        return res.status(201).json(

            new ApiResponse(

                201,

                result.rows[0],

                "Banner created successfully"
            )
        );
    });



// =====================================
// GET ALL BANNERS
// =====================================

const getBanners = asyncHandler(
    async (_, res) => {

        const result =
            await pool.query(

                `
        SELECT *

        FROM banners

        WHERE is_active = true

        ORDER BY created_at DESC
        `
            );



        return res.status(200).json(

            new ApiResponse(

                200,

                result.rows,

                "Banners fetched successfully"
            )
        );
    });

// =====================================
// UPDATE BANNER
// =====================================

const updateBanner = asyncHandler(
    async (req, res) => {

        const { id } = req.params;

        const {

            title,
            image_url,
            redirect_type,
            redirect_id,
            is_active

        } = req.body;



        const result =
            await pool.query(

                `
        UPDATE banners

        SET

        title = $1,
        image_url = $2,
        redirect_type = $3,
        redirect_id = $4,
        is_active = $5

        WHERE id = $6

        RETURNING *
        `,

                [

                    title,
                    image_url,
                    redirect_type,
                    redirect_id,
                    is_active,
                    id
                ]
            );



        if (result.rows.length === 0) {

            throw new ApiError(
                404,
                "Banner not found"
            );
        }



        return res.status(200).json(

            new ApiResponse(

                200,

                result.rows[0],

                "Banner updated successfully"
            )
        );
    });


// =====================================
// DELETE BANNER
// =====================================

const deleteBanner = asyncHandler(
    async (req, res) => {

        const { id } = req.params;



        const result =
            await pool.query(

                `
        DELETE FROM banners

        WHERE id = $1

        RETURNING *
        `,

                [id]
            );



        if (result.rows.length === 0) {

            throw new ApiError(
                404,
                "Banner not found"
            );
        }



        return res.status(200).json(

            new ApiResponse(

                200,

                result.rows[0],

                "Banner deleted successfully"
            )
        );
    });



export {

    createBanner,

    getBanners,

    updateBanner,

    deleteBanner
};
