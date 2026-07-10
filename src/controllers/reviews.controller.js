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

// Helper to format review row with comprehensive image aliases for frontends
const formatReviewResponse = (row) => {
    if (!row) return null;
    const photos = Array.isArray(row.photo_urls) ? row.photo_urls : [];
    const firstImage = photos.length > 0 ? photos[0] : null;
    return {
        ...row,
        photo_urls: photos,
        photoUrls: photos,
        images: photos,
        photo: firstImage,
        review_image: firstImage,
        reviewImage: firstImage,
        image_url: firstImage,
        imageUrl: firstImage,
    };
};

// =====================================
// ADD REVIEW
// =====================================

const addReview = asyncHandler(
async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    const {
        rating,
        comment,
        photo_urls,
        photoUrls,
        images
    } = req.body;

    let uploadedPhotos = [];
    if (Array.isArray(photo_urls)) uploadedPhotos.push(...photo_urls);
    else if (typeof photo_urls === "string" && photo_urls.trim() !== "") uploadedPhotos.push(photo_urls.trim());
    if (Array.isArray(photoUrls)) uploadedPhotos.push(...photoUrls);
    else if (typeof photoUrls === "string" && photoUrls.trim() !== "") uploadedPhotos.push(photoUrls.trim());
    if (Array.isArray(images)) uploadedPhotos.push(...images);
    else if (typeof images === "string" && images.trim() !== "") uploadedPhotos.push(images.trim());

    // Process multer uploaded files
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded && uploaded.secure_url) {
                uploadedPhotos.push(uploaded.secure_url);
            }
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    } else if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded && uploaded.secure_url) {
            uploadedPhotos.push(uploaded.secure_url);
        }
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }

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
            comment,
            photo_urls
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            userId,
            productId,
            rating,
            comment,
            uploadedPhotos
        ]
    );

    const formattedReview = formatReviewResponse(result.rows[0]);

    return res.status(201).json(
        new ApiResponse(
            201,
            formattedReview,
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

    const formattedReviews = reviews.rows.map(row => formatReviewResponse(row));

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
                formattedReviews
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
        comment,
        photo_urls,
        photoUrls,
        images
    } = req.body;

    let uploadedPhotos = [];
    if (Array.isArray(photo_urls)) uploadedPhotos.push(...photo_urls);
    else if (typeof photo_urls === "string" && photo_urls.trim() !== "") uploadedPhotos.push(photo_urls.trim());
    if (Array.isArray(photoUrls)) uploadedPhotos.push(...photoUrls);
    else if (typeof photoUrls === "string" && photoUrls.trim() !== "") uploadedPhotos.push(photoUrls.trim());
    if (Array.isArray(images)) uploadedPhotos.push(...images);
    else if (typeof images === "string" && images.trim() !== "") uploadedPhotos.push(images.trim());

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded && uploaded.secure_url) {
                uploadedPhotos.push(uploaded.secure_url);
            }
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    } else if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded && uploaded.secure_url) {
            uploadedPhotos.push(uploaded.secure_url);
        }
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }

    const photosToUpdate = uploadedPhotos.length > 0 ? uploadedPhotos : null;

    const result =
    await pool.query(
        `
        UPDATE reviews
        SET
        rating = COALESCE($1, rating),
        comment = COALESCE($2, comment),
        photo_urls = COALESCE($3, photo_urls)
        WHERE id = $4
        AND user_id = $5
        RETURNING *
        `,
        [
            rating,
            comment,
            photosToUpdate,
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

    const formattedReview = formatReviewResponse(result.rows[0]);

    return res.status(200).json(
        new ApiResponse(
            200,
            formattedReview,
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