import pool from "../db/index.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



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

        ORDER BY created_at DESC
        `
    );



    // =====================================
    // TRENDING PRODUCTS
    // =====================================

    const trendingProducts =
    await pool.query(

        `
        SELECT *

        FROM products

        WHERE is_available = true

        ORDER BY created_at DESC

        LIMIT 10
        `
    );



    // =====================================
    // OFFER PRODUCTS
    // =====================================

    const offerProducts =
    await pool.query(

        `
        SELECT *

        FROM products

        WHERE discount_price IS NOT NULL

        ORDER BY created_at DESC

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