import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



// =====================================
// ADD TO WISHLIST
// =====================================

const addToWishlist = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { productId } = req.params;



    // CHECK ALREADY EXISTS

    const existing =
    await pool.query(

        `
        SELECT *

        FROM wishlist

        WHERE user_id = $1
        AND product_id = $2
        `,

        [

            userId,
            productId
        ]
    );



    if (existing.rows.length > 0) {

        throw new ApiError(
            409,
            "Already in wishlist"
        );
    }



    const result =
    await pool.query(

        `
        INSERT INTO wishlist
        (
            user_id,
            product_id
        )

        VALUES ($1,$2)

        RETURNING *
        `,

        [

            userId,
            productId
        ]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Added to wishlist"
        )
    );
});




// =====================================
// GET WISHLIST
// =====================================

const getWishlist = asyncHandler(
async (req, res) => {

    const userId = req.user.id;



    const result =
    await pool.query(

        `
        SELECT

            wishlist.id,

            products.*

        FROM wishlist

        JOIN products
        ON wishlist.product_id = products.id

        WHERE wishlist.user_id = $1

        ORDER BY wishlist.created_at DESC
        `,

        [userId]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Wishlist fetched successfully"
        )
    );
});




// =====================================
// REMOVE FROM WISHLIST
// =====================================

const removeFromWishlist = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { productId } = req.params;



    const result =
    await pool.query(

        `
        DELETE FROM wishlist

        WHERE user_id = $1
        AND product_id = $2

        RETURNING *
        `,

        [

            userId,
            productId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Wishlist item not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Removed from wishlist"
        )
    );
});



export {

    addToWishlist,
    getWishlist,
    removeFromWishlist
};