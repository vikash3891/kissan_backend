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

const createCategory = asyncHandler(async (req, res) => {

    const {
        name,
        description = null,
        is_active = true,
        sort_order = 0
    } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(
            400,
            "Category name is required"
        );
    }

    // ===============================
    // CHECK DUPLICATE
    // ===============================

    const existing = await pool.query(
        `
        SELECT *
        FROM categories
        WHERE LOWER(name)=LOWER($1)
        `,
        [name.trim()]
    );

    if (existing.rows.length > 0) {
        throw new ApiError(
            409,
            "Category already exists"
        );
    }

    // ===============================
    // IMAGE UPLOAD
    // ===============================

    let image_url = null;

    const imageLocalPath = req.file?.path;

    if (imageLocalPath) {

        const uploadedImage =
            await uploadOnCloudinary(imageLocalPath);

        if (!uploadedImage) {
            throw new ApiError(
                500,
                "Image upload failed"
            );
        }

        image_url = uploadedImage.secure_url;

        fs.unlinkSync(imageLocalPath);
    }

    // ===============================
    // INSERT
    // ===============================

    const result = await pool.query(
        `
        INSERT INTO categories
        (
            name,
            description,
            image_url,
            is_active,
            sort_order
        )

        VALUES
        (
            $1,$2,$3,$4,$5
        )

        RETURNING *
        `,
        [
            name.trim(),
            description,
            image_url,
            is_active,
            sort_order
        ]
    );

    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Category created successfully"

        )

    );

});


// =====================================
// TOGGLE CATEGORY STATUS
// =====================================

const toggleCategoryStatus = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const { is_active } = req.body;

    const result = await pool.query(
        `
        UPDATE categories

        SET
            is_active = $1

        WHERE id = $2

        RETURNING *
        `,
        [
            is_active,
            id
        ]
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
            "Category status updated successfully"
        )
    );

});


// =====================================
// CATEGORY STATS
// =====================================

const getCategoryStats = asyncHandler(async (req, res) => {

    const result = await pool.query(
        `
        SELECT

            COUNT(*) AS total_categories,

            COUNT(*) FILTER
            (
                WHERE is_active = TRUE
            ) AS active_categories,

            COUNT(*) FILTER
            (
                WHERE is_active = FALSE
            ) AS inactive_categories

        FROM categories
        `
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            result.rows[0],
            "Category statistics fetched successfully"
        )
    );

});

// =====================================
// REORDER CATEGORIES
// =====================================

const reorderCategories = asyncHandler(async (req, res) => {

    const categories = req.body;

    if (!Array.isArray(categories)) {

        throw new ApiError(
            400,
            "Array expected"
        );

    }

    for (const item of categories) {

        await pool.query(
            `
            UPDATE categories

            SET
                sort_order = $1

            WHERE id = $2
            `,
            [
                item.sort_order,
                item.id
            ]
        );

    }

    return res.status(200).json(

        new ApiResponse(

            200,

            null,

            "Category order updated successfully"

        )

    );

});



// ===============================
// UPDATE CATEGORY
// ===============================

const updateCategory = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const {
        name,
        description
    } = req.body;

    // ===============================
    // CHECK CATEGORY EXISTS
    // ===============================

    const existingCategory = await pool.query(
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
    // KEEP OLD VALUES
    // ===============================

    let imageUrl = existingCategory.rows[0].image_url;

    const updatedName =
        name ?? existingCategory.rows[0].name;

    const updatedDescription =
        description ?? existingCategory.rows[0].description;

    // ===============================
    // IMAGE UPLOAD
    // ===============================

    const imageLocalPath = req.file?.path;

    if (imageLocalPath) {

        const uploadedImage =
            await uploadOnCloudinary(imageLocalPath);

        if (!uploadedImage) {
            throw new ApiError(
                500,
                "Image upload failed"
            );
        }

        imageUrl = uploadedImage.secure_url;

        fs.unlinkSync(imageLocalPath);
    }

    // ===============================
    // UPDATE CATEGORY
    // ===============================

    const result = await pool.query(
        `
        UPDATE categories
        SET

            name = $1,
            description = $2,
            image_url = $3

        WHERE id = $4

        RETURNING *
        `,
        [
            updatedName,
            updatedDescription,
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

const deleteCategory = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const result = await pool.query(

        `
        UPDATE categories

        SET

            is_active = FALSE

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

            "Category disabled successfully"

        )

    );

});



// ===============================
// GET PRODUCTS BY CATEGORY
// ===============================

const getProductsByCategory = asyncHandler(
async (req, res) => {

    const { id } = req.params;

    const result = await pool.query(

        `
        SELECT

            p.id,
            p.name,
            p.description,
            p.price,
            p.discount_price,
            p.stock,
            p.image_url,
            p.brand,
            p.unit,
            p.is_available,
            p.created_at,

            json_build_object(

                'id', c.id,
                'name', c.name,
                'description', c.description,
                'image_url', c.image_url

            ) AS category

        FROM products p

        LEFT JOIN categories c
        ON p.category_id = c.id

        WHERE p.category_id = $1
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


// =====================================
// GET SINGLE CATEGORY
// =====================================

const getSingleCategory = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const result = await pool.query(
        `
        SELECT
            id,
            name,
            description,
            image_url,
            is_active,
            sort_order,
            created_at
        FROM categories
        WHERE id = $1
        `,
        [id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            result.rows[0],
            "Category fetched successfully"
        )
    );

});

// =====================================
// SEARCH CATEGORY
// =====================================

const searchCategories = asyncHandler(async (req, res) => {

    const { keyword = "" } = req.query;

    const result = await pool.query(
        `
        SELECT
            id,
            name,
            description,
            image_url
        FROM categories
        WHERE
            is_active = TRUE
            AND
            LOWER(name) LIKE LOWER($1)
        ORDER BY name
        `,
        [`%${keyword}%`]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            result.rows,
            "Categories fetched successfully"
        )
    );

});



// =====================================
// GET CATEGORIES
// =====================================

const getCategories = asyncHandler(async (req, res) => {

    let { page, limit } = req.query;

    // No pagination -> return all

    if (!page && !limit) {

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                description,
                image_url
            FROM categories
            WHERE is_active = TRUE
            ORDER BY sort_order, name
            `
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                result.rows,
                "Categories fetched successfully"
            )
        );

    }

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const offset = (page - 1) * limit;

    const categories = await pool.query(
        `
        SELECT
            id,
            name,
            description,
            image_url
        FROM categories
        WHERE is_active = TRUE
        ORDER BY sort_order,name
        LIMIT $1
        OFFSET $2
        `,
        [limit, offset]
    );

    const total = await pool.query(
        `
        SELECT COUNT(*)
        FROM categories
        WHERE is_active = TRUE
        `
    );

    return res.status(200).json(

        new ApiResponse(

            200,

            {

                currentPage: page,
                totalPages: Math.ceil(total.rows[0].count / limit),
                totalCategories: Number(total.rows[0].count),
                categories: categories.rows

            },

            "Categories fetched successfully"

        )

    );

});



export {
    

    createCategory,

    getCategories,

    updateCategory,

    deleteCategory,

    getProductsByCategory,
        getSingleCategory,
    searchCategories,
    toggleCategoryStatus,
    getCategoryStats,
    reorderCategories

};