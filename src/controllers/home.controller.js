import pool from "../db/index.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";

import { PRODUCT_SELECT } from "../utils/productQuery.js";


const getHomeData = asyncHandler(
async (_, res) => {

    // =====================================
    // BANNERS
    // =====================================

    const banners =
    await pool.query(

        `
        SELECT *

        FROM banners

        WHERE is_active = true

        ORDER BY created_at DESC
        `
    );



    // =====================================
    // CATEGORIES
    // =====================================

    const categories =
    await pool.query(

        `
        SELECT *

        FROM categories
        WHERE is_active = true AND is_archived = false
        ORDER BY sort_order, created_at DESC
        `
    );



    // =====================================
    // TRENDING PRODUCTS
    // =====================================

    const trendingProducts =
    await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.is_available = true

        ORDER BY p.created_at DESC

        LIMIT 10
        `
    );



    // =====================================
    // OFFER PRODUCTS
    // =====================================

    const offerProducts =
    await pool.query(

        `
        ${PRODUCT_SELECT}

        WHERE p.discount_price IS NOT NULL

        ORDER BY p.created_at DESC

        LIMIT 10
        `
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            {

                banners:
                banners.rows,

                categories:
                categories.rows,

                trendingProducts:
                trendingProducts.rows,

                offerProducts:
                offerProducts.rows
            },

            "Home data fetched successfully"
        )
    );
});



export {

    getHomeData
};