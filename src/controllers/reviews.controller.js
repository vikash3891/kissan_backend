import fs from "fs";
import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";

import { uploadOnCloudinary ,
    deleteFromCloudinary
}
from "../utils/cloudinary.js";



// =====================================================
// FORMAT REVIEW RESPONSE
// =====================================================

const formatReviewResponse = (review) => {

    const images =
        Array.isArray(review.review_images)
            ? review.review_images.filter(Boolean).map(img => typeof img === 'object' && img !== null ? (img.url || img.secure_url) : img).filter(Boolean)
            : [];

    return {

        ...review,

        photo_urls: images,

        photoUrls: images,

        images,

        totalImages: images.length,

        firstImage:

            images.length > 0
                ? images[0]
                : null,

        image_url:

            images.length > 0
                ? images[0]
                : null,

        imageUrl:

            images.length > 0
                ? images[0]
                : null
    };

};



// =====================================================
// UPLOAD REVIEW IMAGES
// =====================================================

const uploadReviewImages = async (files = []) => {

    const uploadedImages = [];

    for (const file of files) {

        const uploaded =
            await uploadOnCloudinary(file.path);

        if (uploaded?.secure_url) {

            uploadedImages.push(
                {
    url: uploaded.secure_url,
    public_id: uploaded.public_id
}
            );
        }

        if (

            file.path &&
            fs.existsSync(file.path)

        ) {

            fs.unlinkSync(file.path);
        }
    }

    return uploadedImages;
};



// =====================================================
// ADD REVIEW
// =====================================================

const addReview = asyncHandler(

async (req, res) => {

    const userId =
        req.user.id;

    const {

        productId

    } = req.params;

    const {

        rating,
        comment

    } = req.body;



    // =====================================
    // VALIDATION
    // =====================================

    if (!rating) {

        throw new ApiError(

            400,

            "Rating is required"

        );
    }



    // =====================================
    // PRODUCT EXISTS
    // =====================================

    const product =
    await pool.query(

        `
        SELECT id

        FROM products

        WHERE id=$1
        `,

        [productId]
    );



    if (

        product.rows.length === 0

    ) {

        throw new ApiError(

            404,

            "Product not found"

        );
    }



    // =====================================
    // CHECK EXISTING REVIEW
    // =====================================

    const existing =
    await pool.query(

        `
        SELECT id

        FROM reviews

        WHERE user_id=$1

        AND product_id=$2
        `,

        [

            userId,

            productId

        ]
    );



    if (

        existing.rows.length > 0

    ) {

        throw new ApiError(

            409,

            "You already reviewed this product"

        );
    }



    // =====================================
    // UPLOAD IMAGES
    // =====================================

    let images = [];

    if (

        req.files &&
        req.files.length > 0

    ) {

        images =
        await uploadReviewImages(

            req.files

        );
    }



    // =====================================
    // SAVE REVIEW
    // =====================================

    const review =
    await pool.query(

        `
        INSERT INTO reviews
        (

            user_id,
            product_id,
            rating,
            comment,
            review_images

        )

        VALUES
        (

            $1,
            $2,
            $3,
            $4,
            $5::jsonb

        )

        RETURNING *
        `,

        [

            userId,

            productId,

            rating ? Math.round(Number(rating)) : null,

            comment || "",

            JSON.stringify(images)

        ]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            formatReviewResponse(

                review.rows[0]

            ),

            "Review added successfully"

        )

    );

});

// =====================================================
// GET PRODUCT REVIEWS
// =====================================================

const getProductReviews = asyncHandler(

async (req, res) => {

    const { productId } = req.params;

    const currentUserId =
        req.user?.id || null;



    // =====================================
    // CHECK PRODUCT
    // =====================================

    const product =
    await pool.query(

        `
        SELECT id

        FROM products

        WHERE id=$1
        `,

        [productId]

    );



    if (product.rows.length === 0) {

        throw new ApiError(

            404,

            "Product not found"

        );

    }



    // =====================================
    // REVIEWS
    // =====================================

    const reviewResult =
    await pool.query(

        `
        SELECT

            r.*,

            u.phone,

            CASE

                WHEN r.user_id=$2

                THEN TRUE

                ELSE FALSE

            END AS is_my_review

        FROM reviews r

        JOIN users u

        ON r.user_id=u.id

        WHERE r.product_id=$1

        ORDER BY

        r.created_at DESC
        `,

        [

            productId,

            currentUserId

        ]

    );



    const reviews =
        reviewResult.rows.map(

            formatReviewResponse

        );



    // =====================================
    // SUMMARY
    // =====================================

    const summary =
    await pool.query(

        `
        SELECT

            ROUND(

                AVG(rating),

                1

            ) AS average_rating,

            COUNT(*) AS total_reviews

        FROM reviews

        WHERE product_id=$1
        `,

        [productId]

    );



    // =====================================
    // RATING BREAKDOWN
    // =====================================

    const breakdown =
    await pool.query(

        `
        SELECT

            rating,

            COUNT(*)::int AS total

        FROM reviews

        WHERE product_id=$1

        GROUP BY rating
        `,

        [productId]

    );



    // Default counts

    const ratingDistribution = {

        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0

    };



    breakdown.rows.forEach(

        (item) => {

            ratingDistribution[
                item.rating
            ] = item.total;

        }

    );



    // =====================================
    // RESPONSE
    // =====================================

    return res.status(200).json(

        new ApiResponse(

            200,

            {

                averageRating:

                    Number(

                        summary.rows[0]
                        .average_rating

                    ) || 0,

                totalReviews:

                    Number(

                        summary.rows[0]
                        .total_reviews

                    ) || 0,

                ratingDistribution,

                reviews

            },

            "Reviews fetched successfully"

        )

    );

});

// =====================================================
// UPDATE REVIEW
// =====================================================

const updateReview = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const { reviewId } = req.params;

    const {
        rating,
        comment,
        remove_images
    } = req.body;

    // =====================================
    // CHECK REVIEW
    // =====================================

    const existingReview = await pool.query(
        `
        SELECT *
        FROM reviews
        WHERE id = $1
        AND user_id = $2
        `,
        [
            reviewId,
            userId
        ]
    );

    if (existingReview.rows.length === 0) {

        throw new ApiError(
            404,
            "Review not found"
        );

    }

    const review = existingReview.rows[0];

    // =====================================
    // EXISTING IMAGES
    // =====================================

    let images =
        Array.isArray(review.review_images)
            ? [...review.review_images]
            : [];

    // =====================================
    // REMOVE SELECTED IMAGES
    // =====================================

// =====================================
// REMOVE SELECTED IMAGES
// =====================================

if (remove_images) {

    let imagesToRemove = [];

    if (Array.isArray(remove_images)) {

        imagesToRemove = remove_images;

    } else if (typeof remove_images === "string") {

        try {

            imagesToRemove = JSON.parse(remove_images);

        } catch {

            imagesToRemove = [remove_images];

        }

    }

    // Delete images from Cloudinary
    for (const image of images) {

        if (imagesToRemove.includes(image.public_id)) {

            await deleteFromCloudinary(image.public_id);

        }

    }

    // Remove images from database array
    images = images.filter(

        image =>

            !imagesToRemove.includes(image.public_id)

    );

}

    // =====================================
    // UPLOAD NEW IMAGES
    // =====================================

    if (

        req.files &&
        req.files.length > 0

    ) {

        const uploadedImages =
            await uploadReviewImages(req.files);

        images.push(...uploadedImages);

    }

    // =====================================
    // REMOVE DUPLICATES
    // =====================================

    images = [...new Set(images)];

    // =====================================
    // MAX 5 IMAGES
    // =====================================

    if (images.length > 5) {

        throw new ApiError(

            400,

            "Maximum 5 review images allowed"

        );

    }

    // =====================================
    // UPDATE REVIEW
    // =====================================

    const result = await pool.query(

        `
        UPDATE reviews

        SET

            rating = COALESCE($1,rating),

            comment = COALESCE($2,comment),

            review_images = $3::jsonb

        WHERE id = $4

        AND user_id = $5

        RETURNING *
        `,

        [

            rating ? Math.round(Number(rating)) : null,

            comment,

            JSON.stringify(images),

            reviewId,

            userId

        ]

    );

    return res.status(200).json(

        new ApiResponse(

            200,

            formatReviewResponse(

                result.rows[0]

            ),

            "Review updated successfully"

        )

    );

});

// =====================================================
// DELETE REVIEW
// =====================================================

const deleteReview = asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { reviewId } = req.params;

    const existing = await pool.query(
        `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`,
        [reviewId, userId]
    );

    if (existing.rows.length === 0) {
        throw new ApiError(404, "Review not found");
    }

    const review = existing.rows[0];

    // Delete images from Cloudinary
    const images = Array.isArray(review.review_images) ? review.review_images : [];
    for (const img of images) {
        if (img?.public_id) {
            await deleteFromCloudinary(img.public_id);
        }
    }

    await pool.query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);

    return res.status(200).json(
        new ApiResponse(200, {}, "Review deleted successfully")
    );

});

// =====================================================
// EXPORTS
// =====================================================

export {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview
};
