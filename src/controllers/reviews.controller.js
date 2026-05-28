import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



// =====================================
// ADD REVIEW
// =====================================

const addReview = asyncHandler(
async (req, res) => {

    const userId = req.user.id;
    console.log(userId);

    const { productId } = req.params;

    const {

        rating,
        comment

    } = req.body;



    if (!rating) {

        throw new ApiError(
            400,
            "Rating is required"
        );
    }



    // CHECK PRODUCT EXISTS

    const product =
    await pool.query(

        `
        SELECT *

        FROM products

        WHERE id = $1
        `,

        [productId]
    );



    if (product.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }



    // CHECK EXISTING REVIEW

    const existing =
    await pool.query(

        `
        SELECT *

        FROM reviews

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
            "You already reviewed this product"
        );
    }



    const result =
    await pool.query(

        `
        INSERT INTO reviews
        (

            user_id,
            product_id,
            rating,
            comment

        )

        VALUES ($1,$2,$3,$4)

        RETURNING *
        `,

        [

            userId,
            productId,
            rating,
            comment
        ]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Review added successfully"
        )
    );
});




// =====================================
// GET PRODUCT REVIEWS
// =====================================

const getProductReviews = asyncHandler(
async (req, res) => {

    const { productId } = req.params;



    const reviews =
    await pool.query(

        `
        SELECT

            reviews.*,

            users.phone

        FROM reviews

        JOIN users
        ON reviews.user_id = users.id

        WHERE product_id = $1

        ORDER BY created_at DESC
        `,

        [productId]
    );



    // =====================================
    // AVG RATING
    // =====================================

    const avgResult =
    await pool.query(

        `
        SELECT

            AVG(rating) as average_rating,

            COUNT(*) as total_reviews

        FROM reviews

        WHERE product_id = $1
        `,

        [productId]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            {

                averageRating:
                Number(
                    avgResult.rows[0]
                    .average_rating
                ).toFixed(1),

                totalReviews:
                Number(
                    avgResult.rows[0]
                    .total_reviews
                ),

                reviews:
                reviews.rows
            },

            "Reviews fetched successfully"
        )
    );
});




// =====================================
// UPDATE REVIEW
// =====================================

const updateReview = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { reviewId } = req.params;

    const {

        rating,
        comment

    } = req.body;



    const result =
    await pool.query(

        `
        UPDATE reviews

        SET

        rating = $1,
        comment = $2

        WHERE id = $3
        AND user_id = $4

        RETURNING *
        `,

        [

            rating,
            comment,
            reviewId,
            userId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Review not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Review updated successfully"
        )
    );
});




// =====================================
// DELETE REVIEW
// =====================================

const deleteReview = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { reviewId } = req.params;



    const result =
    await pool.query(

        `
        DELETE FROM reviews

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,

        [

            reviewId,
            userId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Review not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Review deleted successfully"
        )
    );
});



export {

    addReview,

    getProductReviews,

    updateReview,

    deleteReview
};