import pool from "../db/index.js";

import { ApiError }
    from "../utils/ApiError.js";

import { ApiResponse }
    from "../utils/ApiResponse.js";

import { asyncHandler }
    from "../utils/asyncHandler.js";

const getCompleteOrder = async (orderId) => {

    // ==========================
    // ORDER + ADDRESS
    // ==========================

    const orderResult = await pool.query(

        `
        SELECT

            o.id,
            o.order_status,
            o.payment_status,
            o.total_amount,
            o.discount_amount,
            o.final_amount,
            o.payment_method,
            o.created_at,

            json_build_object(

                'id', a.id,
                'full_name', a.full_name,
                'phone', a.phone,
                'house_no', a.house_no,
                'area', a.area,
                'landmark', a.landmark,
                'city', a.city,
                'state', a.state,
                'pincode', a.pincode,
                'address_type', a.address_type

            ) AS address

        FROM orders o

        JOIN addresses a

        ON o.address_id = a.id

        WHERE o.id = $1
        `,

        [orderId]

    );

    // ==========================
    // ORDER ITEMS
    // ==========================

    const itemsResult = await pool.query(

        `
        SELECT

            oi.quantity,
            oi.price,

            json_build_object(

                'id', p.id,
                'name', p.name,
                'image_url', p.image_url,
                'brand', p.brand,
                'unit', p.unit

            ) AS product

        FROM order_items oi

        JOIN products p

        ON oi.product_id = p.id

        WHERE oi.order_id = $1
        `,

        [orderId]

    );

    return {

        ...orderResult.rows[0],

        items: itemsResult.rows

    };

};

// =====================================
// PLACE ORDER
// =====================================

const placeOrder = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const {
        address_id,
        payment_method,
        coupon_code = null
    } = req.body;

    // ==============================
    // VALIDATION
    // ==============================

    if (!address_id) {
        throw new ApiError(400, "Address ID is required");
    }

    // ==============================
    // CHECK ADDRESS
    // ==============================

    const address = await pool.query(
        `
        SELECT *
        FROM addresses
        WHERE id = $1
        AND user_id = $2
        `,
        [address_id, userId]
    );

    if (address.rows.length === 0) {
        throw new ApiError(404, "Address not found");
    }

    // ==============================
    // GET CART ITEMS
    // ==============================

    const cartItems = await pool.query(
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
        throw new ApiError(400, "Cart is empty");
    }

    // ==============================
    // CHECK STOCK & CALCULATE TOTAL
    // ==============================

    let totalAmount = 0;

    for (const item of cartItems.rows) {

        if (item.stock < item.quantity) {

            throw new ApiError(
                400,
                `${item.name} has only ${item.stock} item(s) available`
            );

        }

        const sellingPrice =
            item.discount_price ?? item.price;

        totalAmount +=
            Number(sellingPrice) * item.quantity;
    }

    // ==============================
    // COUPON LOGIC
    // ==============================

    let discountAmount = 0;

    // Coupon logic will be implemented later

    const finalAmount =
        totalAmount - discountAmount;

    // ==============================
    // CREATE ORDER
    // ==============================

    const orderResult = await pool.query(

        `
        INSERT INTO orders
        (

            user_id,
            address_id,
            total_amount,
            payment_method,
            payment_status,
            order_status,
            coupon_code,
            discount_amount,
            final_amount

        )

        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
        )

        RETURNING *
        `,

        [

            userId,
            address_id,
            totalAmount,
            payment_method || "COD",
            "pending",
            "pending",
            coupon_code,
            discountAmount,
            finalAmount

        ]

    );

    const order = orderResult.rows[0];

    // ==============================
    // INSERT ORDER ITEMS
    // ==============================

    for (const item of cartItems.rows) {

        const sellingPrice =
            item.discount_price ?? item.price;

        // SAVE ORDER ITEM

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
                sellingPrice

            ]

        );

        // REDUCE STOCK

        await pool.query(

            `
            UPDATE products

            SET

                stock = stock - $1,

                is_available = CASE

                    WHEN stock - $1 <= 0
                    THEN FALSE

                    ELSE TRUE

                END

            WHERE id = $2
            `,

            [

                item.quantity,
                item.product_id

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

    // ==============================
    // COMPLETE ORDER RESPONSE
    // ==============================

    const completeOrder =
        await getCompleteOrder(order.id);

    return res.status(201).json(

        new ApiResponse(

            201,

            completeOrder,

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


const cancelOrder = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;

    // ==============================
    // CHECK ORDER
    // ==============================

    const order = await pool.query(

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

    if (order.rows[0].order_status === "cancelled") {

        throw new ApiError(

            400,

            "Order already cancelled"

        );

    }

    // ==============================
    // GET ORDER ITEMS
    // ==============================

    const orderItems = await pool.query(

        `
        SELECT *

        FROM order_items

        WHERE order_id = $1
        `,

        [id]

    );

    // ==============================
    // RESTORE STOCK
    // ==============================

    for (const item of orderItems.rows) {

        await pool.query(

            `
            UPDATE products

            SET

                stock = stock + $1,

                is_available = TRUE

            WHERE id = $2
            `,

            [

                item.quantity,

                item.product_id

            ]

        );

    }

    // ==============================
    // CANCEL ORDER
    // ==============================

    const result = await pool.query(

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