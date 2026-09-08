import express from "express";

import {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview
} from "../controllers/reviews.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

import { upload }
from "../middlewares/multer.middleware.js";

const router = express.Router();

// =====================================
// ADD REVIEW
// =====================================

router.post(
    "/:productId",
    verifyJWT,
    // upload.any(),
    upload.array("images",5),
    addReview
);

// =====================================
// GET REVIEWS
// =====================================

router.get(
    "/:productId",
    getProductReviews
);

// =====================================
// UPDATE REVIEW
// =====================================

router.put(
    "/:reviewId",

    verifyJWT,
    upload.array("images",5),
    updateReview
);



// =====================================
// DELETE REVIEW
// =====================================

router.delete(

    "/:reviewId",

    verifyJWT,

    deleteReview
);



export default router;