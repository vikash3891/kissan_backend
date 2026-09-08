
import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";



// ======================================
// GET COMPLETE ORDER DETAILS
// ======================================

const getCompleteOrder = async (client, orderId) => {

    // ======================================
    // ORDER DETAILS
    // ======================================

    const orderResult = await client.query(

        `
        SELECT

            o.id,
            o.user_id,
            o.order_status,
            o.payment_status,
            o.payment_method,
            o.total_amount,
            o.discount_amount,
            o.final_amount,
            o.coupon_code,
            o.created_at,

            json_build_object(

                'id',a.id,
                'full_name',a.full_name,
                'phone',a.phone,
                'house_no',a.house_no,
                'area',a.area,
                'landmark',a.landmark,
                'city',a.city,
                'state',a.state,
                'pincode',a.pincode,
                'address_type',a.address_type

            ) AS address

        FROM orders o

        JOIN addresses a
        ON o.address_id=a.id

        WHERE o.id=$1
        `,
        [orderId]
    );



    if (orderResult.rows.length === 0) {

        throw new ApiError(
            404,
            "Order not found"
        );

    }



    // ======================================
    // ORDER ITEMS
    // ======================================

    const itemsResult = await client.query(

        `
        SELECT

            oi.id,
            oi.quantity,
            oi.price,

            json_build_object(

                'id',p.id,
                'name',p.name,
                'image_url',p.image_url,
                'brand',p.brand,
                'unit',p.unit,
                'price',p.price,
                'discount_price',p.discount_price

            ) AS product

        FROM order_items oi

        JOIN products p

        ON oi.product_id=p.id

        WHERE oi.order_id=$1
        `,
        [orderId]
    );



    return {

        ...orderResult.rows[0],

        items: itemsResult.rows

    };

};




// ======================================
// PLACE ORDER
// ======================================

const placeOrder = asyncHandler(async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const userId = req.user.id;

        const {

            address_id,
            payment_method = "COD",
            coupon_code = null,
            cart_item_ids

        } = req.body;



        // ======================================
        // VALIDATION
        // ======================================

        if (!address_id) {

            throw new ApiError(
                400,
                "Address ID is required"
            );

        }



        // ======================================
        // CHECK ADDRESS
        // ======================================

        const address = await client.query(

            `
            SELECT *

            FROM addresses

            WHERE id=$1
            AND user_id=$2
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



        // ======================================
        // GET CART ITEMS
        // ======================================

        let cartQuery = `
            SELECT

                cart.id,
                cart.quantity,

                p.id AS product_id,
                p.name,
                p.price,
                p.discount_price,
                p.stock,
                p.image_url,
                p.brand,
                p.unit

            FROM cart

            JOIN products p

            ON cart.product_id=p.id

            WHERE cart.user_id=$1
        `;

        const values = [userId];



        if (

            Array.isArray(cart_item_ids)

            &&

            cart_item_ids.length > 0

        ) {

            cartQuery +=
            `

            AND cart.id = ANY($2)

            `;

            values.push(cart_item_ids);

        }



        const cartItems =
        await client.query(

            cartQuery,
            values

        );



        if (cartItems.rows.length === 0) {

            throw new ApiError(
                400,
                "Cart is empty"
            );

        }

                // ======================================
        // STOCK CHECK + TOTAL CALCULATION
        // ======================================

        let totalAmount = 0;

        for (const item of cartItems.rows) {

            if (!item.stock || item.stock <= 0) {

                throw new ApiError(

                    400,

                    `${item.name} is out of stock`

                );

            }

            if (item.quantity > item.stock) {

                throw new ApiError(

                    400,

                    `${item.name} has only ${item.stock} item(s) available`

                );

            }

            const sellingPrice =

                item.discount_price ??

                item.price;

            totalAmount +=

                Number(sellingPrice) *

                Number(item.quantity);

        }



        // ======================================
        // COUPON
        // ======================================

        let discountAmount = 0;

        let appliedCoupon = null;

        if (coupon_code) {

            const couponResult = await client.query(

                `
                SELECT *

                FROM coupons

                WHERE

                    code=$1

                    AND is_active=true

                `,

                [

                    coupon_code

                ]

            );

            if (

                couponResult.rows.length > 0

            ) {

                const coupon =

                    couponResult.rows[0];

                appliedCoupon =

                    coupon.code;

                if (

                    Number(totalAmount)

                    >=

                    Number(coupon.minimum_order_amount)

                ) {

                    if (

                        coupon.discount_type === "percentage"

                    ) {

                        discountAmount =

                            Number(totalAmount)

                            *

                            Number(coupon.discount_value)

                            / 100;

                        if (

                            coupon.maximum_discount

                            &&

                            discountAmount >

                            coupon.maximum_discount

                        ) {

                            discountAmount =

                                Number(

                                    coupon.maximum_discount

                                );

                        }

                    }

                    else {

                        discountAmount =

                            Number(

                                coupon.discount_value

                            );

                    }

                }

            }

        }



        const finalAmount =

            Number(totalAmount)

            -

            Number(discountAmount);



        // ======================================
        // CREATE ORDER
        // ======================================

        const orderResult =

            await client.query(

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

                    payment_method,

                    "pending",

                    "pending",

                    appliedCoupon,

                    discountAmount,

                    finalAmount

                ]

            );



        const order =

            orderResult.rows[0];




                 // ======================================
        // INSERT ORDER ITEMS
        // ======================================

        for (const item of cartItems.rows) {

            const sellingPrice =
                item.discount_price ??
                item.price;

            // SAVE ORDER ITEM

            await client.query(

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

            // ======================================
            // REDUCE PRODUCT STOCK
            // ======================================

            await client.query(

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



        // ======================================
        // REMOVE ITEMS FROM CART
        // ======================================

        if (

            Array.isArray(cart_item_ids)

            &&

            cart_item_ids.length > 0

        ) {

            await client.query(

                `
                DELETE FROM cart

                WHERE

                    user_id = $1

                    AND

                    id = ANY($2)
                `,

                [

                    userId,
                    cart_item_ids

                ]

            );

        }

        else {

            await client.query(

                `
                DELETE FROM cart

                WHERE user_id = $1
                `,

                [

                    userId

                ]

            );

        }



        // ======================================
        // COMMIT TRANSACTION
        // ======================================

        await client.query("COMMIT");



        // ======================================
        // COMPLETE ORDER RESPONSE
        // ======================================

        const completeOrder =

            await getCompleteOrder(

                client,
                order.id

            );



        return res.status(201).json(

            new ApiResponse(

                201,

                completeOrder,

                "Order placed successfully"

            )

        );

    }

    catch (error) {

        await client.query("ROLLBACK");

        throw error;

    }

    finally {

        client.release();

    }

});



// =====================================
// GET MY ORDERS
// =====================================

const getMyOrders = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const orders = await pool.query(

        `
        SELECT

            id

        FROM orders

        WHERE user_id = $1

        ORDER BY created_at DESC
        `,

        [

            userId

        ]

    );

    const response = [];

    for (const order of orders.rows) {

        const completeOrder =

            await getCompleteOrder(

                pool,
                order.id

            );

        response.push(

            completeOrder

        );

    }

    return res.status(200).json(

        new ApiResponse(

            200,

            response,

            "Orders fetched successfully"

        )

    );

});



// =====================================
// GET SINGLE ORDER
// =====================================

const getSingleOrder = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;

    // =====================================
    // CHECK ORDER EXISTS
    // =====================================

    const order = await pool.query(

        `
        SELECT id

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

    // =====================================
    // GET COMPLETE ORDER
    // =====================================

    const completeOrder =

        await getCompleteOrder(

           pool,
            id

        );

    return res.status(200).json(

        new ApiResponse(

            200,

            completeOrder,

            "Order fetched successfully"

        )

    );

});

// =====================================
// CANCEL ORDER
// =====================================

const cancelOrder = asyncHandler(async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const userId = req.user.id;

        const { id } = req.params;

        // =====================================
        // CHECK ORDER
        // =====================================

        const orderResult = await client.query(

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

        if (orderResult.rows.length === 0) {

            throw new ApiError(

                404,

                "Order not found"

            );

        }

        const order = orderResult.rows[0];

        // =====================================
        // VALIDATIONS
        // =====================================

        if (order.order_status === "cancelled") {

            throw new ApiError(

                400,

                "Order already cancelled"

            );

        }

        if (order.order_status === "delivered") {

            throw new ApiError(

                400,

                "Delivered order cannot be cancelled"

            );

        }

        // =====================================
        // GET ORDER ITEMS
        // =====================================

        const orderItems = await client.query(

            `
            SELECT

                product_id,
                quantity

            FROM order_items

            WHERE order_id = $1
            `,

            [

                id

            ]

        );

        // =====================================
        // RESTORE STOCK
        // =====================================

        for (const item of orderItems.rows) {

            await client.query(

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

        // =====================================
        // UPDATE ORDER
        // =====================================

        await client.query(

            `
            UPDATE orders

            SET

                order_status='cancelled'

            WHERE id=$1
            `,

            [

                id

            ]

        );

        await client.query("COMMIT");

        // =====================================
        // COMPLETE RESPONSE
        // =====================================

        const completeOrder =

            await getCompleteOrder(
                client,

                id

            );

        return res.status(200).json(

            new ApiResponse(

                200,

                completeOrder,

                "Order cancelled successfully"

            )

        );

    }

    catch (error) {

        await client.query("ROLLBACK");

        throw error;

    }

    finally {

        client.release();

    }

});

// =====================================
// BUY NOW
// =====================================

const buyNow = asyncHandler(async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const userId = req.user.id;

        const {

            product_id,
            quantity,
            address_id,
            payment_method = "COD"

        } = req.body;

        if (

            !product_id ||

            !quantity ||

            !address_id

        ) {

            throw new ApiError(

                400,

                "Product, quantity and address are required"

            );

        }

        // ADDRESS

        const address = await client.query(

            `
            SELECT *

            FROM addresses

            WHERE id=$1

            AND user_id=$2
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

        // PRODUCT

        const product = await client.query(

            `
            SELECT *

            FROM products

            WHERE id=$1
            `,

            [

                product_id

            ]

        );

        if (product.rows.length === 0) {

            throw new ApiError(

                404,

                "Product not found"

            );

        }

        const p = product.rows[0];

        if (!p.is_available) {

            throw new ApiError(

                400,

                "Product unavailable"

            );

        }

        if (quantity > p.stock) {

            throw new ApiError(

                400,

                `Only ${p.stock} item(s) available`

            );

        }

        const sellingPrice =

            p.discount_price ??

            p.price;

        const total =

            Number(sellingPrice) *

            Number(quantity);

        // CREATE ORDER

        const orderResult = await client.query(

            `
            INSERT INTO orders
            (

                user_id,
                address_id,
                total_amount,
                payment_method,
                payment_status,
                order_status,
                discount_amount,
                final_amount

            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )

            RETURNING *
            `,

            [

                userId,

                address_id,

                total,

                payment_method,

                "pending",

                "pending",

                0,

                total

            ]

        );

        const order =

            orderResult.rows[0];

        // ORDER ITEM

        await client.query(

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

                product_id,

                quantity,

                sellingPrice

            ]

        );

        // STOCK

        await client.query(

            `
            UPDATE products

            SET

                stock = stock - $1,

                is_available = CASE

                    WHEN stock-$1<=0

                    THEN FALSE

                    ELSE TRUE

                END

            WHERE id=$2
            `,

            [

                quantity,

                product_id

            ]

        );

        await client.query("COMMIT");

        const completeOrder =

            await getCompleteOrder(
                client,

                order.id

            );

        return res.status(201).json(

            new ApiResponse(

                201,

                completeOrder,

                "Buy Now order placed successfully"

            )

        );

    }

    catch (error) {

        await client.query("ROLLBACK");

        throw error;

    }

    finally {

        client.release();

    }

});
// =====================================
// ADMIN - GET ALL ORDERS
// =====================================

const getAllOrders = asyncHandler(async (req, res) => {

    let {

        page = 1,
        limit = 10,
        order_status,
        payment_status,
        search

    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const offset = (page - 1) * limit;

    // =====================================
    // BUILD QUERY
    // =====================================

    let query = `
        SELECT
            o.id

        FROM orders o

        JOIN users u
        ON o.user_id = u.id

        WHERE 1=1
    `;

    const values = [];
    let index = 1;

    // =====================================
    // ORDER STATUS FILTER
    // =====================================

    if (order_status) {

        query += `

            AND o.order_status = $${index}

        `;

        values.push(order_status);

        index++;

    }

    // =====================================
    // PAYMENT STATUS FILTER
    // =====================================

    if (payment_status) {

        query += `

            AND o.payment_status = $${index}

        `;

        values.push(payment_status);

        index++;

    }

    // =====================================
    // SEARCH
    // =====================================

    if (search) {

        query += `

            AND
            (

                CAST(o.id AS TEXT)
                ILIKE
                $${index}

                OR

                u.phone
                ILIKE
                $${index}

            )

        `;

        values.push(`%${search}%`);

        index++;

    }

    // =====================================
    // COUNT QUERY
    // =====================================

    const countQuery =

        query.replace(

            "SELECT\n            o.id",

            "SELECT COUNT(*)"

        );

    const totalOrders =

        await pool.query(

            countQuery,

            values

        );

    // =====================================
    // PAGINATION
    // =====================================

    query += `

        ORDER BY o.created_at DESC

        LIMIT $${index}

        OFFSET $${index + 1}

    `;

    values.push(limit);

    values.push(offset);

    const orders =

        await pool.query(

            query,

            values

        );

    // =====================================
    // COMPLETE RESPONSE
    // =====================================

    const response = [];

    for (const order of orders.rows) {

        const completeOrder =

            await getCompleteOrder(
                pool,

                order.id

            );

        response.push(

            completeOrder

        );

    }

    return res.status(200).json(

        new ApiResponse(

            200,

            {

                page,

                limit,

                total_orders:

                    Number(
                        totalOrders.rows[0].count
                    ),

                total_pages:

                    Math.ceil(

                        Number(

                            totalOrders.rows[0].count

                        ) / limit

                    ),

                orders: response

            },

            "Orders fetched successfully"

        )

    );

});



// =====================================
// ADMIN - GET SINGLE ORDER
// =====================================

const getAdminSingleOrder = asyncHandler(async (req, res) => {

    const { id } = req.params;

    // =====================================
    // CHECK ORDER EXISTS
    // =====================================

    const order = await pool.query(

        `
        SELECT id

        FROM orders

        WHERE id = $1
        `,

        [

            id

        ]

    );

    if (order.rows.length === 0) {

        throw new ApiError(

            404,

            "Order not found"

        );

    }

    // =====================================
    // GET COMPLETE ORDER
    // =====================================

    const completeOrder =

        await getCompleteOrder(
        pool,
            id

        );

    return res.status(200).json(

        new ApiResponse(

            200,

            completeOrder,

            "Order fetched successfully"

        )

    );

});


// =====================================
// ADMIN - UPDATE ORDER STATUS
// =====================================

const updateOrderStatus = asyncHandler(async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;

        const {

            order_status,
            payment_status

        } = req.body;

        const orderResult = await client.query(

            `
            SELECT *

            FROM orders

            WHERE id=$1
            `,

            [

                id

            ]

        );

        if (orderResult.rows.length === 0) {

            throw new ApiError(

                404,

                "Order not found"

            );

        }

        const order = orderResult.rows[0];

        // =====================================
        // VALID STATUS
        // =====================================

        const validStatus = [

            "pending",
            "confirmed",
            "packed",
            "out_for_delivery",
            "delivered",
            "cancelled"

        ];

        if (

            order_status

            &&

            !validStatus.includes(order_status)

        ) {

            throw new ApiError(

                400,

                "Invalid order status"

            );

        }

        // =====================================
        // RESTORE STOCK IF CANCELLED
        // =====================================

        if (

            order_status === "cancelled"

            &&

            order.order_status !== "cancelled"

        ) {

            const items = await client.query(

                `
                SELECT

                    product_id,
                    quantity

                FROM order_items

                WHERE order_id=$1
                `,

                [

                    id

                ]

            );

            for (const item of items.rows) {

                await client.query(

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

        }

        // =====================================
        // COD PAYMENT
        // =====================================

        let newPaymentStatus =

            payment_status ||

            order.payment_status;

        if (

            order.payment_method === "COD"

            &&

            order_status === "delivered"

        ) {

            newPaymentStatus =

                "paid";

        }

        // =====================================
        // UPDATE ORDER
        // =====================================

        await client.query(

            `
            UPDATE orders

            SET

                order_status = COALESCE($1, order_status),

                payment_status = $2

            WHERE id = $3
            `,

            [

                order_status,

                newPaymentStatus,

                id

            ]

        );

        await client.query("COMMIT");

        const completeOrder =

            await getCompleteOrder(client,id);

        return res.status(200).json(

            new ApiResponse(

                200,

                completeOrder,

                "Order updated successfully"

            )

        );

    }

    catch (error) {

        await client.query("ROLLBACK");

        throw error;

    }

    finally {

        client.release();

    }

});

export {

    placeOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    buyNow,
    getAllOrders,
    getAdminSingleOrder,
    updateOrderStatus

}