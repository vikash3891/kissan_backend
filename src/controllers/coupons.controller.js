



import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";
const createCoupon = asyncHandler(
async (req,res)=>{

    const {

        code,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount,
        usage_limit,
        expiry_date

    } = req.body;

    const result =
    await pool.query(

        `
        INSERT INTO coupons
        (

            code,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount,
            usage_limit,
            expiry_date

        )

        VALUES
        (

            $1,$2,$3,$4,
            $5,$6,$7,$8

        )

        RETURNING *
        `,

        [

            code,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount,
            usage_limit,
            expiry_date
        ]
    );

    return res.status(201).json(

        new ApiResponse(

            201,
            result.rows[0],
            "Coupon created successfully"
        )
    );
});



const applyCoupon = asyncHandler(
async (req,res)=>{

    const {

        code,
        orderAmount

    } = req.body;



    const coupon =
    await pool.query(

        `
        SELECT *

        FROM coupons

        WHERE code = $1
        AND is_active = TRUE
        `,

        [code]
    );



    if (
        coupon.rows.length === 0
    ) {

        throw new ApiError(
            404,
            "Invalid coupon"
        );
    }



    const c =
    coupon.rows[0];



    if (

        new Date(c.expiry_date)
        < new Date()

    ) {

        throw new ApiError(
            400,
            "Coupon expired"
        );
    }



    if (

        Number(orderAmount)
        < Number(c.minimum_order_amount)

    ) {

        throw new ApiError(

            400,

            `Minimum order amount ₹${c.minimum_order_amount}`
        );
    }



    let discount = 0;



    if (

        c.discount_type
        === "percentage"

    ) {

        discount =

            Number(orderAmount)
            *
            Number(c.discount_value)
            / 100;



        if (

            c.maximum_discount > 0 &&
            discount >
            c.maximum_discount

        ) {

            discount =
            c.maximum_discount;
        }
    }

    else {

        discount =
        c.discount_value;
    }



    const finalAmount =

        Number(orderAmount)
        -
        Number(discount);



    return res.status(200).json(

        new ApiResponse(

            200,

            {

                coupon: c.code,

                discount,

                finalAmount
            },

            "Coupon applied successfully"
        )
    );
});

export {
    createCoupon,
    applyCoupon

}