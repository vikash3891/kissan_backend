import express from "express";

import {

    addReview,
    getProductReviews,
    updateReview,
    deleteReview

}
from "../controllers/reviews.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

const router = express.Router();



// =====================================
// ADD REVIEW
// =====================================

router.post(

    "/:productId",

    verifyJWT,

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