

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
import { PRODUCT_SELECT } from "../utils/productQuery.js";


// ===============================
// CREATE PRODUCT
// ===============================

const createProduct = asyncHandler(async (req, res) => {

    const {
        name,
        description,
        price,
        discount_price,
        stock,
        category_id,
        brand,
        unit
    } = req.body;

    if (!name || !price || !category_id) {
        throw new ApiError(
            400,
            "Name, Price and Category are required"
        );
    }

    // ===============================
    // CHECK CATEGORY EXISTS
    // ===============================

    const categoryResult = await pool.query(
        `
        SELECT *
        FROM categories
        WHERE id = $1
        `,
        [category_id]
    );

    if (categoryResult.rows.length === 0) {
        throw new ApiError(
            404,
            "Category not found"
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
    // INSERT PRODUCT
    // ===============================

    const insertResult = await pool.query(

        `
        INSERT INTO products
        (
            name,
            description,
            price,
            discount_price,
            stock,
            image_url,
            category_id,
            brand,
            unit
        )

        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
        )

        RETURNING id
        `,

        [
            name,
            description,
            price,
            discount_price,
            stock,
            image_url,
            category_id,
            brand,
            unit
        ]
    );

    // ===============================
    // FETCH COMPLETE PRODUCT
    // ===============================

    const product = await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.id = $1
        `,

        [insertResult.rows[0].id]
    );

    return res.status(201).json(

        new ApiResponse(

            201,

            product.rows[0],

            "Product created successfully"
        )
    );

});



const getAllProducts = asyncHandler(async (req, res) => {

    const {
        search,
        category_id,
        minPrice,
        maxPrice,
        sort,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
        ${PRODUCT_SELECT}
        WHERE 1=1
    `;

    const values = [];
    let index = 1;

    // ===============================
    // SEARCH
    // ===============================

    if (search) {

        query += `
            AND (
                LOWER(p.name) LIKE LOWER($${index})
                OR LOWER(p.description) LIKE LOWER($${index})
                OR LOWER(p.brand) LIKE LOWER($${index})
            )
        `;

        values.push(`%${search}%`);
        index++;
    }

    // ===============================
    // CATEGORY FILTER
    // ===============================

    if (category_id) {

        query += `
            AND p.category_id = $${index}
        `;

        values.push(category_id);
        index++;
    }

    // ===============================
    // MIN PRICE
    // ===============================

    if (minPrice) {

        query += `
            AND p.price >= $${index}
        `;

        values.push(minPrice);
        index++;
    }

    // ===============================
    // MAX PRICE
    // ===============================

    if (maxPrice) {

        query += `
            AND p.price <= $${index}
        `;

        values.push(maxPrice);
        index++;
    }

    // ===============================
    // SORTING
    // ===============================

    switch (sort) {

        case "price_asc":

            query += ` ORDER BY p.price ASC `;
            break;

        case "price_desc":

            query += ` ORDER BY p.price DESC `;
            break;

        case "oldest":

            query += ` ORDER BY p.created_at ASC `;
            break;

        default:

            query += ` ORDER BY p.created_at DESC `;
    }

    // ===============================
    // PAGINATION
    // ===============================

    query += `
        LIMIT $${index}
        OFFSET $${index + 1}
    `;

    values.push(limit);
    values.push(offset);

    const products = await pool.query(query, values);

    // ===============================
    // TOTAL PRODUCTS
    // ===============================

    let countQuery = `
        SELECT COUNT(*)
        FROM products p
        WHERE 1=1
    `;

    const countValues = [];
    let countIndex = 1;

    if (search) {

        countQuery += `
            AND LOWER(p.name)
            LIKE LOWER($${countIndex})
        `;

        countValues.push(`%${search}%`);
        countIndex++;
    }

    if (category_id) {

        countQuery += `
            AND p.category_id = $${countIndex}
        `;

        countValues.push(category_id);
        countIndex++;
    }

    if (minPrice) {

        countQuery += `
            AND p.price >= $${countIndex}
        `;

        countValues.push(minPrice);
        countIndex++;
    }

    if (maxPrice) {

        countQuery += `
            AND p.price <= $${countIndex}
        `;

        countValues.push(maxPrice);
        countIndex++;
    }

    const total = await pool.query(
        countQuery,
        countValues
    );

    return res.status(200).json(

        new ApiResponse(

            200,

            {

                totalProducts: Number(total.rows[0].count),

                currentPage: Number(page),

                totalPages: Math.ceil(
                    total.rows[0].count / limit
                ),

                products: products.rows

            },

            "Products fetched successfully"

        )

    );

});

// ===============================
// GET SINGLE PRODUCT
// ===============================

const getSingleProduct = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const result = await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.id = $1
        `,

        [id]

    );

    if (result.rows.length === 0) {

        throw new ApiError(

            404,

            "Product not found"

        );

    }

    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Product fetched successfully"

        )

    );

});



// ===============================
// UPDATE PRODUCT
// ===============================

const updateProduct = asyncHandler(async (req, res) => {

    const { id } = req.params;

    // ===============================
    // GET EXISTING PRODUCT
    // ===============================

    const existingProduct = await pool.query(
        `
        SELECT *
        FROM products
        WHERE id = $1
        `,
        [id]
    );

    if (existingProduct.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }

    const product = existingProduct.rows[0];

    // ===============================
    // REQUEST BODY
    // ===============================

    const {

        name,
        description,
        price,
        discount_price,
        stock,
        category_id,
        brand,
        unit

    } = req.body;

    // ===============================
    // VALIDATE CATEGORY
    // ===============================

    if (category_id) {

        const category = await pool.query(
            `
            SELECT id
            FROM categories
            WHERE id = $1
            `,
            [category_id]
        );

        if (category.rows.length === 0) {

            throw new ApiError(
                404,
                "Category not found"
            );
        }
    }

    // ===============================
    // IMAGE UPLOAD
    // ===============================

    let image_url = product.image_url;

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
    // UPDATE PRODUCT
    // ===============================

    await pool.query(

        `
        UPDATE products

        SET

            name = $1,
            description = $2,
            price = $3,
            discount_price = $4,
            stock = $5,
            image_url = $6,
            category_id = $7,
            brand = $8,
            unit = $9

        WHERE id = $10
        `,

        [

            name ?? product.name,

            description ?? product.description,

            price ?? product.price,

            discount_price ?? product.discount_price,

            stock ?? product.stock,

            image_url,

            category_id ?? product.category_id,

            brand ?? product.brand,

            unit ?? product.unit,

            id

        ]

    );

    // ===============================
    // FETCH UPDATED PRODUCT
    // ===============================

    const updatedProduct =
    await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.id = $1
        `,

        [id]

    );

    return res.status(200).json(

        new ApiResponse(

            200,

            updatedProduct.rows[0],

            "Product updated successfully"

        )

    );

});


// ===============================
// DELETE PRODUCT
// ===============================

const deleteProduct = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const product = await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.id = $1
        `,

        [id]
    );

    if (product.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }

    await pool.query(

        `
        DELETE FROM products
        WHERE id = $1
        `,

        [id]
    );

    return res.status(200).json(

        new ApiResponse(

            200,

            product.rows[0],

            "Product deleted successfully"
        )
    );

});

const updateStock = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const { stock } = req.body;

    if (stock === undefined) {

        throw new ApiError(
            400,
            "Stock is required"
        );
    }

    if (Number(stock) < 0) {

        throw new ApiError(
            400,
            "Stock cannot be negative"
        );
    }

    const result = await pool.query(

        `
        UPDATE products

        SET

            stock = $1,

            is_available = CASE

                WHEN $1 <= 0
                THEN FALSE

                ELSE TRUE

            END

        WHERE id = $2

        RETURNING id
        `,

        [
            Number(stock),
            id
        ]
    );

    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }

    const product = await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.id = $1
        `,

        [id]
    );

    return res.status(200).json(

        new ApiResponse(

            200,

            product.rows[0],

            "Stock updated successfully"

        )

    );

});
const getInventory = asyncHandler(async (req, res) => {

    const result = await pool.query(

        `
        ${PRODUCT_SELECT}

        ORDER BY p.stock ASC
        `
    );

    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Inventory fetched successfully"

        )

    );

});


export {

    createProduct,

    getAllProducts,

    getSingleProduct,

    updateProduct,

    deleteProduct,
    updateStock,
    getInventory,

};