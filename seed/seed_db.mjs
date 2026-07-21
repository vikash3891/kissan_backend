import "dotenv/config";
import pool from "../src/db/index.js";
import { tableExists, columnExists } from "./schema_inspector.js";

import { seedCategories } from "./categories.js";
import { generateProducts } from "./products.js";
import { generateReviews } from "./reviews.js";
import { seedBanners } from "./banners.js";
import { seedCoupons } from "./coupons.js";
import { generateAddresses, generateCartItems, generateWishlist } from "./user_data.js";
import { generateOrders } from "./orders.js";

async function executePhase(phaseName, callback) {
    console.log(`\n--- Starting Phase: ${phaseName} ---`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        console.log(`[SUCCESS] Phase ${phaseName} completed.`);
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ERROR] Phase ${phaseName} failed:`, err.message);
        return null;
    } finally {
        client.release();
    }
}

async function runSeeder() {
    const startTime = Date.now();
    const stats = { categories: 0, products: 0, reviews: 0, addresses: 0, wishlist: 0, cart: 0, orders: 0, orderItems: 0, coupons: 0, banners: 0 };

    try {
        console.log("====================================");
        console.log("Kisaan Kart Database Seeder Started");
        console.log("====================================");

        // Fetch users for later phases
        const userRes = await pool.query("SELECT id, phone FROM users LIMIT 20");
        const users = userRes.rows;
        if (users.length === 0) {
            console.error("No users found in database. Seed skipped for user-dependent tables.");
        }

        // PHASE 1: Categories
        let categoryMap = {};
        await executePhase("Categories", async (client) => {
            for (const cat of seedCategories) {
                const existing = await client.query("SELECT id FROM categories WHERE name = $1", [cat.name]);
                if (existing.rows.length === 0) {
                    const res = await client.query(
                        `INSERT INTO categories (name, description, image_url, sort_order, is_active) 
                         VALUES ($1, $2, $3, $4, $5) RETURNING id, name`,
                        [cat.name, cat.description, cat.image_url, cat.sort_order, true]
                    );
                    categoryMap[res.rows[0].name] = res.rows[0].id;
                    stats.categories++;
                } else {
                    categoryMap[cat.name] = existing.rows[0].id;
                }
            }
        });

        // PHASE 2: Products
        let insertedProducts = [];
        await executePhase("Products", async (client) => {
            const productsData = generateProducts(categoryMap);
            for (const p of productsData) {
                const existing = await client.query("SELECT id FROM products WHERE name = $1", [p.name]);
                if (existing.rows.length === 0) {
                    const res = await client.query(
                        `INSERT INTO products 
                        (name, description, price, discount_price, stock, image_url, category, brand, unit, is_available, created_at, category_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                        [p.name, p.description, p.price, p.discount_price, p.stock, p.image_url, p.category, p.brand, p.unit, p.is_available, p.created_at, p.category_id]
                    );
                    insertedProducts.push(res.rows[0]);
                    stats.products++;
                } else {
                    insertedProducts.push(existing.rows[0]);
                }
            }
        });

        if (users.length > 0 && insertedProducts.length > 0) {
            // PHASE 3: Reviews
            if (await tableExists("reviews")) {
                const hasPhotoUrls = await columnExists("reviews", "photo_urls");
                const hasReviewImages = await columnExists("reviews", "review_images");
                
                await executePhase("Reviews", async (client) => {
                    const reviewsData = generateReviews(users, insertedProducts);
                    for (const r of reviewsData) {
                        const existing = await client.query("SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2", [r.user_id, r.product_id]);
                        if (existing.rows.length === 0) {
                            if (hasPhotoUrls) {
                                await client.query(
                                    `INSERT INTO reviews (user_id, product_id, rating, comment, created_at, photo_urls) VALUES ($1, $2, $3, $4, $5, $6::text[])`,
                                    [r.user_id, r.product_id, r.rating, r.comment, r.created_at, r.images]
                                );
                            } else if (hasReviewImages) {
                                await client.query(
                                    `INSERT INTO reviews (user_id, product_id, rating, comment, created_at, review_images) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
                                    [r.user_id, r.product_id, r.rating, r.comment, r.created_at, JSON.stringify(r.images)]
                                );
                            } else {
                                await client.query(
                                    `INSERT INTO reviews (user_id, product_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)`,
                                    [r.user_id, r.product_id, r.rating, r.comment, r.created_at]
                                );
                            }
                            stats.reviews++;
                        }
                    }
                });
            } else {
                console.log("[SKIP] Table 'reviews' does not exist.");
            }

            // PHASE 4: Addresses
            let insertedAddresses = [];
            if (await tableExists("addresses")) {
                await executePhase("Addresses", async (client) => {
                    const addrData = generateAddresses(users);
                    for (const a of addrData) {
                        const existing = await client.query("SELECT id FROM addresses WHERE user_id = $1 AND house_no = $2", [a.user_id, a.house_no]);
                        if (existing.rows.length === 0) {
                            const res = await client.query(
                                `INSERT INTO addresses (user_id, full_name, phone, pincode, state, city, house_no, area, landmark, address_type, is_default)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                                [a.user_id, a.full_name, a.phone, a.pincode, a.state, a.city, a.house_no, a.area, a.landmark, a.address_type, a.is_default]
                            );
                            insertedAddresses.push(res.rows[0]);
                            stats.addresses++;
                        } else {
                            insertedAddresses.push(existing.rows[0]);
                        }
                    }
                });
            } else {
                console.log("[SKIP] Table 'addresses' does not exist.");
            }

            // PHASE 5: Orders
            if (await tableExists("orders") && await tableExists("order_items") && insertedAddresses.length > 0) {
                await executePhase("Orders", async (client) => {
                    const ordersData = generateOrders(users, insertedAddresses, insertedProducts);
                    for (const o of ordersData) {
                        const res = await client.query(
                            `INSERT INTO orders (user_id, address_id, total_amount, payment_method, payment_status, order_status, coupon_code, discount_amount, final_amount, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                            [o.user_id, o.address_id, o.total_amount, o.payment_method, o.payment_status, o.order_status, o.coupon_code, o.discount_amount, o.final_amount, o.created_at]
                        );
                        const orderId = res.rows[0].id;
                        stats.orders++;

                        for (const item of o.items) {
                            await client.query(
                                `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
                                [orderId, item.product_id, item.quantity, item.price]
                            );
                            stats.orderItems++;
                        }
                    }
                });
            } else {
                console.log("[SKIP] Tables 'orders'/'order_items' missing, or no addresses available.");
            }

            // PHASE 6: Wishlist
            if (await tableExists("wishlist")) {
                await executePhase("Wishlist", async (client) => {
                    const wlData = generateWishlist(users, insertedProducts);
                    for (const w of wlData) {
                        const existing = await client.query("SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2", [w.user_id, w.product_id]);
                        if (existing.rows.length === 0) {
                            await client.query(`INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)`, [w.user_id, w.product_id]);
                            stats.wishlist++;
                        }
                    }
                });
            } else {
                console.log("[SKIP] Table 'wishlist' does not exist.");
            }

            // PHASE 7: Cart
            if (await tableExists("cart")) {
                await executePhase("Cart", async (client) => {
                    const cartData = generateCartItems(users, insertedProducts);
                    for (const c of cartData) {
                        const existing = await client.query("SELECT id FROM cart WHERE user_id = $1 AND product_id = $2", [c.user_id, c.product_id]);
                        if (existing.rows.length === 0) {
                            await client.query(`INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)`, [c.user_id, c.product_id, c.quantity]);
                            stats.cart++;
                        }
                    }
                });
            } else {
                console.log("[SKIP] Table 'cart' does not exist.");
            }
        }

        // PHASE 8: Coupons
        if (await tableExists("coupons")) {
            await executePhase("Coupons", async (client) => {
                for (const c of seedCoupons) {
                    const existing = await client.query("SELECT id FROM coupons WHERE code = $1", [c.code]);
                    if (existing.rows.length === 0) {
                        await client.query(
                            `INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, used_count, is_active)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
                            [c.code, c.description, c.discount_type, c.discount_value, c.minimum_order_amount, c.maximum_discount, c.usage_limit, c.is_active]
                        );
                        stats.coupons++;
                    }
                }
            });
        } else {
            console.log("[SKIP] Table 'coupons' does not exist.");
        }

        // PHASE 9: Banners
        if (await tableExists("banners")) {
            await executePhase("Banners", async (client) => {
                for (const b of seedBanners) {
                    const existing = await client.query("SELECT id FROM banners WHERE title = $1", [b.title]);
                    if (existing.rows.length === 0) {
                        await client.query(
                            `INSERT INTO banners (title, image_url, redirect_type, is_active) VALUES ($1, $2, $3, $4)`,
                            [b.title, b.image_url, b.redirect_type, b.is_active]
                        );
                        stats.banners++;
                    }
                }
            });
        } else {
            console.log("[SKIP] Table 'banners' does not exist.");
        }

        const endTime = Date.now();
        const execTime = ((endTime - startTime) / 1000).toFixed(1);

        console.log("\n====================================");
        console.log("Kisaan Kart Database Seeder Summary");
        console.log("====================================");
        console.log(`Categories Added : ${stats.categories}`);
        console.log(`Products Added   : ${stats.products}`);
        console.log(`Reviews Added    : ${stats.reviews}`);
        console.log(`Addresses Added  : ${stats.addresses}`);
        console.log(`Wishlist Added   : ${stats.wishlist}`);
        console.log(`Cart Items Added : ${stats.cart}`);
        console.log(`Orders Added     : ${stats.orders}`);
        console.log(`Order Items      : ${stats.orderItems}`);
        console.log(`Coupons Added    : ${stats.coupons}`);
        console.log(`Banners Added    : ${stats.banners}`);
        console.log(`\nExecution Time   : ${execTime} seconds`);
        console.log("\nDatabase seeded successfully.");
    } catch (err) {
        console.error("Seeding failed critically:", err);
    } finally {
        await pool.end();
    }
}

runSeeder();
