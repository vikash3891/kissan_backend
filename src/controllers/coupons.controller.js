



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

const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let statusCondition = '';
    if (status === 'active') {
        statusCondition = 'WHERE is_active = true AND expiry_date > NOW()';
    } else if (status === 'expired') {
        statusCondition = 'WHERE expiry_date <= NOW()';
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM coupons ${statusCondition}`);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
        `SELECT * FROM coupons ${statusCondition} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return res.status(200).json(
        new ApiResponse(200, {
            coupons: result.rows,
            pagination: { page: Number(page), limit: Number(limit), total, totalPages }
        }, "Coupons fetched successfully")
    );
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }
    values.push(id);

    const result = await pool.query(
        `UPDATE coupons SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse(200, result.rows[0], "Coupon updated successfully")
    );
});

const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        `DELETE FROM coupons WHERE id = $1 RETURNING id`,
        [id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Coupon deleted successfully")
    );
});

const toggleCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        `UPDATE coupons SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse(200, result.rows[0], "Coupon toggled successfully")
    );
});

export {
    createCoupon,
    applyCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    toggleCoupon
}