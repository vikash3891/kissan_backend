import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



// =====================================
// PLACE ORDER
// =====================================

const placeOrder = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const {

        address_id,
        payment_method

    } = req.body;



    // ==============================
    // VALIDATION
    // ==============================

    if (!address_id) {

        throw new ApiError(
            400,
            "Address ID is required"
        );
    }



    // ==============================
    // CHECK ADDRESS
    // ==============================

    const address =
    await pool.query(

        `
        SELECT *

        FROM addresses

        WHERE id = $1
        AND user_id = $2
        `,

        [

            address_id,
            userId
        ]
    );



    if (address.rows.length === 0) {

        throw new ApiError(
            404,
            "Address not found"
        );
    }



    // ==============================
    // GET CART ITEMS
    // ==============================

    const cartItems =
    await pool.query(

        `
        SELECT

            cart.id,
            cart.quantity,

            products.id AS product_id,
            products.name,
            products.price,
            products.discount_price,
            products.stock

        FROM cart

        JOIN products
        ON cart.product_id = products.id

        WHERE cart.user_id = $1
        `,

        [userId]
    );



    if (cartItems.rows.length === 0) {

        throw new ApiError(
            400,
            "Cart is empty"
        );
    }



    // ==============================
    // CALCULATE TOTAL
    // ==============================

    let totalAmount = 0;



    for (const item of cartItems.rows) {

        const finalPrice =

            item.discount_price
            || item.price;



        totalAmount +=

            Number(finalPrice)
            * item.quantity;
    }



    // ==============================
    // CREATE ORDER
    // ==============================

    const orderResult =
    await pool.query(

        `
        INSERT INTO orders
        (

            user_id,
            address_id,
            total_amount,
            payment_method

        )

        VALUES
        (
            $1,$2,$3,$4
        )

        RETURNING *
        `,

        [

            userId,
            address_id,
            totalAmount,
            payment_method || "COD"
        ]
    );



    const order =
    orderResult.rows[0];



    // ==============================
    // INSERT ORDER ITEMS
    // ==============================

    for (const item of cartItems.rows) {

        const finalPrice =

            item.discount_price
            || item.price;



        await pool.query(

            `
            INSERT INTO order_items
            (

                order_id,
                product_id,
                quantity,
                price

            )

            VALUES
            (
                $1,$2,$3,$4
            )
            `,

            [

                order.id,
                item.product_id,
                item.quantity,
                finalPrice
            ]
        );
    }



    // ==============================
    // CLEAR CART
    // ==============================

    await pool.query(

        `
        DELETE FROM cart

        WHERE user_id = $1
        `,

        [userId]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            order,

            "Order placed successfully"
        )
    );
});




// =====================================
// GET MY ORDERS
// =====================================

const getMyOrders = asyncHandler(
async (req, res) => {

    const userId = req.user.id;



    const result =
    await pool.query(

        `
        SELECT *

        FROM orders

        WHERE user_id = $1

        ORDER BY created_at DESC
        `,

        [userId]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Orders fetched successfully"
        )
    );
});




// =====================================
// GET SINGLE ORDER
// =====================================

const getSingleOrder = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;



    // ==============================
    // GET ORDER
    // ==============================

    const order =
    await pool.query(

        `
        SELECT *

        FROM orders

        WHERE id = $1
        AND user_id = $2
        `,

        [

            id,
            userId
        ]
    );



    if (order.rows.length === 0) {

        throw new ApiError(
            404,
            "Order not found"
        );
    }



    // ==============================
    // GET ORDER ITEMS
    // ==============================

    const items =
    await pool.query(

        `
        SELECT

            order_items.id,
            order_items.quantity,
            order_items.price,

            products.name,
            products.image_url

        FROM order_items

        JOIN products
        ON order_items.product_id = products.id

        WHERE order_items.order_id = $1
        `,

        [id]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            {

                order: order.rows[0],
                items: items.rows
            },

            "Order fetched successfully"
        )
    );
});




// =====================================
// CANCEL ORDER
// =====================================

const cancelOrder = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;



    const result =
    await pool.query(

        `
        UPDATE orders

        SET order_status = 'cancelled'

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,

        [

            id,
            userId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Order not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Order cancelled successfully"
        )
    );
});

const getAllOrders = asyncHandler(
async (_, res) => {

    const result =
    await pool.query(

        `
        SELECT

            orders.*,

            users.phone

        FROM orders

        JOIN users
        ON orders.user_id = users.id

        ORDER BY orders.created_at DESC
        `
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "All orders fetched successfully"
        )
    );
});



const updateOrderStatus = asyncHandler(
async (req, res) => {

    const { id } = req.params;

    const { order_status } = req.body;



    const validStatuses = [

        "pending",

        "confirmed",

        "packed",

        "shipped",

        "out_for_delivery",

        "delivered",

        "cancelled"
    ];



    if (

        !validStatuses.includes(
            order_status
        )

    ) {

        throw new ApiError(

            400,

            "Invalid order status"
        );
    }



    const result =
    await pool.query(

        `
        UPDATE orders

        SET order_status = $1

        WHERE id = $2

        RETURNING *
        `,

        [

            order_status,
            id
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Order not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Order status updated"
        )
    );
});

const getAdminSingleOrder = asyncHandler(
async (req, res) => {

    const { id } = req.params;



    // ==============================
    // GET ORDER
    // ==============================

    const order =
    await pool.query(

        `
        SELECT

            orders.*,

            users.phone

        FROM orders

        JOIN users
        ON orders.user_id = users.id

        WHERE orders.id = $1
        `,

        [id]
    );



    if (order.rows.length === 0) {

        throw new ApiError(
            404,
            "Order not found"
        );
    }



    // ==============================
    // GET ITEMS
    // ==============================

    const items =
    await pool.query(

        `
        SELECT

            order_items.id,
            order_items.quantity,
            order_items.price,

            products.name,
            products.image_url

        FROM order_items

        JOIN products
        ON order_items.product_id = products.id

        WHERE order_items.order_id = $1
        `,

        [id]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            {

                order: order.rows[0],
                items: items.rows
            },

            "Order fetched successfully"
        )
    );
});

export {

    placeOrder,

    getMyOrders,

    getSingleOrder,

    cancelOrder,

    getAllOrders,

    getAdminSingleOrder,

    updateOrderStatus
};