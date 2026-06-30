import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



// =====================================
// ADD TO CART
// =====================================

const addToCart = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const {

        product_id,
        quantity = 1

    } = req.body;

    // =====================================
    // VALIDATION
    // =====================================

    if (!product_id) {

        throw new ApiError(
            400,
            "Product ID is required"
        );

    }

    if (quantity <= 0) {

        throw new ApiError(
            400,
            "Quantity must be greater than 0"
        );

    }

    // =====================================
    // CHECK PRODUCT EXISTS
    // =====================================

    const product = await pool.query(

        `
        SELECT
            id,
            name,
            stock,
            is_available
        FROM products
        WHERE id = $1
        `,

        [product_id]

    );

    if (product.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );

    }

    const productData = product.rows[0];

    // =====================================
    // CHECK PRODUCT AVAILABILITY
    // =====================================

    if (!productData.is_available || productData.stock <= 0) {

        throw new ApiError(
            400,
            "Product is out of stock"
        );

    }

    // =====================================
    // CHECK EXISTING CART
    // =====================================

    const existingCart = await pool.query(

        `
        SELECT *
        FROM cart
        WHERE user_id = $1
        AND product_id = $2
        `,

        [

            userId,
            product_id

        ]

    );

    // =====================================
    // UPDATE EXISTING CART
    // =====================================

    if (existingCart.rows.length > 0) {

        const totalQuantity =
            existingCart.rows[0].quantity + Number(quantity);

        // CHECK AVAILABLE STOCK

        if (totalQuantity > productData.stock) {

            throw new ApiError(

                400,

                `Only ${productData.stock} item(s) available`

            );

        }

        const updated = await pool.query(

            `
            UPDATE cart

            SET quantity = $1

            WHERE user_id = $2
            AND product_id = $3

            RETURNING *
            `,

            [

                totalQuantity,
                userId,
                product_id

            ]

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                updated.rows[0],

                "Cart updated successfully"

            )

        );

    }

    // =====================================
    // NEW CART ITEM STOCK CHECK
    // =====================================

    if (Number(quantity) > productData.stock) {

        throw new ApiError(

            400,

            `Only ${productData.stock} item(s) available`

        );

    }

    // =====================================
    // ADD NEW ITEM
    // =====================================

    const result = await pool.query(

        `
        INSERT INTO cart
        (

            user_id,
            product_id,
            quantity

        )

        VALUES ($1,$2,$3)

        RETURNING *
        `,

        [

            userId,
            product_id,
            quantity

        ]

    );

    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Product added to cart"

        )

    );

});



// =====================================
// GET USER CART
// =====================================

const getCart = asyncHandler(
async (req, res) => {

    const userId = req.user.id;



    const result =
    await pool.query(

        `
        SELECT

            cart.id,
            cart.quantity,

            products.id AS product_id,
            products.name,
            products.price,
            products.discount_price,
            products.image_url,
            products.stock

        FROM cart

        JOIN products
        ON cart.product_id = products.id

        WHERE cart.user_id = $1

        ORDER BY cart.created_at DESC
        `,

        [userId]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Cart fetched successfully"
        )
    );
});




// =====================================
// UPDATE CART QUANTITY
// =====================================

const updateCartQuantity = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params; // product_id

    const { quantity } = req.body;

    if (!quantity || quantity < 1) {

        throw new ApiError(
            400,
            "Valid quantity required"
        );

    }

    // =============================
    // CHECK PRODUCT
    // =============================

    const product = await pool.query(

        `
        SELECT
            id,
            stock,
            is_available
        FROM products
        WHERE id = $1
        `,

        [id]

    );

    if (product.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );

    }

    const productData = product.rows[0];

    if (!productData.is_available) {

        throw new ApiError(
            400,
            "Product is out of stock"
        );

    }

    if (quantity > productData.stock) {

        throw new ApiError(
            400,
            `Only ${productData.stock} item(s) available`
        );

    }

    // =============================
    // UPDATE CART
    // =============================

    const result = await pool.query(

        `
        UPDATE cart

        SET quantity = $1

        WHERE product_id = $2
        AND user_id = $3

        RETURNING *
        `,

        [

            quantity,
            id,
            userId

        ]

    );

    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Cart item not found"
        );

    }

    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Cart quantity updated"

        )

    );

});

// =====================================
// REMOVE CART ITEM
// =====================================



const removeCartItem = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params; // product_id

    // =============================
    // CHECK ITEM EXISTS
    // =============================

    const cartItem = await pool.query(

        `
        SELECT *

        FROM cart

        WHERE product_id = $1
        AND user_id = $2
        `,

        [

            id,
            userId

        ]

    );

    if (cartItem.rows.length === 0) {

        throw new ApiError(

            404,

            "Cart item not found"

        );

    }

    // =============================
    // DELETE ITEM
    // =============================

    const result = await pool.query(

        `
        DELETE FROM cart

        WHERE product_id = $1
        AND user_id = $2

        RETURNING *
        `,

        [

            id,
            userId

        ]

    );

    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Item removed from cart"

        )

    );

});



// =====================================
// CLEAR CART
// =====================================

const clearCart = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const result = await pool.query(

        `
        DELETE FROM cart

        WHERE user_id = $1

        RETURNING *
        `,

        [userId]

    );

    return res.status(200).json(

        new ApiResponse(

            200,

            {

                items_removed: result.rows.length

            },

            "Cart cleared successfully"

        )

    );

});



export {

    addToCart,

    getCart,

    updateCartQuantity,

    removeCartItem,

    clearCart
};