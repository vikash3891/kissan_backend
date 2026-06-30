import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";
import { uploadOnCloudinary }
from "../utils/cloudinary.js";
import fs from "fs";



// ===============================
// CREATE CATEGORY
// ===============================

const createCategory = asyncHandler(
async (req, res) => {

    const {

        name
        

    } = req.body;

    // ===============================
    // IMAGE UPLOAD
    // ===============================

    let image_url = null;

    const imageLocalPath =
    req.file?.path;



    if (imageLocalPath) {

        const uploadedImage =
        await uploadOnCloudinary(
            imageLocalPath
        );



        if (!uploadedImage) {

            throw new ApiError(
                500,
                "Image upload failed"
            );
        }



        image_url =
        uploadedImage.secure_url;



        // DELETE LOCAL FILE
        fs.unlinkSync(imageLocalPath);
    }

    if (!name) {

        throw new ApiError(
            400,
            "Category name required"
        );
    }



    const existing =
    await pool.query(

        `
        SELECT *

        FROM categories

        WHERE name = $1
        `,

        [name]
    );



    if (existing.rows.length > 0) {

        throw new ApiError(
            409,
            "Category already exists"
        );
    }



    const result =
    await pool.query(

        `
        INSERT INTO categories
        (
            name,
            image_url
        )

        VALUES ($1,$2)

        RETURNING *
        `,

        [name, image_url]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Category created successfully"
        )
    );
});




// ===============================
// GET ALL CATEGORIES
// ===============================

const getCategories = asyncHandler(
async (_, res) => {

    const result =
    await pool.query(

        `
        SELECT *

        FROM categories

        ORDER BY created_at DESC
        `
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Categories fetched successfully"
        )
    );
});




// ===============================
// UPDATE CATEGORY
// ===============================

const updateCategory = asyncHandler(
async (req, res) => {

    const { id } = req.params;

    const { name } = req.body;



    // ===============================
    // CHECK CATEGORY EXISTS
    // ===============================

    const existingCategory =
    await pool.query(

        `
        SELECT *

        FROM categories

        WHERE id = $1
        `,

        [id]
    );



    if (existingCategory.rows.length === 0) {

        throw new ApiError(
            404,
            "Category not found"
        );
    }



    // ===============================
    // DEFAULT OLD IMAGE
    // ===============================

    let imageUrl =
    existingCategory.rows[0].image_url;



    // ===============================
    // IMAGE UPLOAD
    // ===============================

    const imageLocalPath =
    req.file?.path;



    if (imageLocalPath) {

        const uploadedImage =
        await uploadOnCloudinary(
            imageLocalPath
        );



        if (!uploadedImage) {

            throw new ApiError(
                500,
                "Image upload failed"
            );
        }



        imageUrl =
        uploadedImage.secure_url;



        // DELETE LOCAL FILE
        fs.unlinkSync(imageLocalPath);
    }



    // ===============================
    // UPDATE CATEGORY
    // ===============================

    const result =
    await pool.query(

        `
        UPDATE categories

        SET

        name = $1,
        image_url = $2

        WHERE id = $3

        RETURNING *
        `,

        [

            name,
            imageUrl,
            id
        ]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Category updated successfully"
        )
    );
});




// ===============================
// DELETE CATEGORY
// ===============================

const deleteCategory = asyncHandler(
async (req, res) => {

    const { id } = req.params;



    const result =
    await pool.query(

        `
        DELETE FROM categories

        WHERE id = $1

        RETURNING *
        `,

        [id]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Category not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Category deleted successfully"
        )
    );
});




// ===============================
// GET PRODUCTS BY CATEGORY
// ===============================

const getProductsByCategory = asyncHandler(
async (req, res) => {

    const { id } = req.params;



    const result =
    await pool.query(

        `
        SELECT
            p.*,
            c.name AS category_name

        FROM products p

        LEFT JOIN categories c
        ON p.category_id = c.id

        WHERE c.id = $1
        `,

        [id]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Products fetched successfully"
        )
    );
});



export {

    createCategory,

    getCategories,

    updateCategory,

    deleteCategory,

    getProductsByCategory
};