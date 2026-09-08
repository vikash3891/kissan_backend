import "dotenv/config";
import pool from "./src/db/index.js";
import { PRODUCT_SELECT } from "./src/utils/productQuery.js";

async function run() {
    try {
        const banners = await pool.query(`SELECT * FROM banners WHERE is_active = true ORDER BY created_at DESC`);
        const categories = await pool.query(`SELECT * FROM categories ORDER BY created_at DESC`);
        const trendingProducts = await pool.query(`
            ${PRODUCT_SELECT}
            WHERE p.is_available = true
            ORDER BY p.created_at DESC
            LIMIT 10
        `);
        const offerProducts = await pool.query(`
            ${PRODUCT_SELECT}
            WHERE p.discount_price IS NOT NULL
            ORDER BY p.created_at DESC
            LIMIT 10
        `);
        
        console.log("Banners count:", banners.rows.length);
        console.log("Categories count:", categories.rows.length);
        console.log("Trending count:", trendingProducts.rows.length);
        console.log("Offers count:", offerProducts.rows.length);
        
        console.log("\nFirst Category:", JSON.stringify(categories.rows[0], null, 2));
        console.log("\nFirst Banner:", JSON.stringify(banners.rows[0], null, 2));
        console.log("\nFirst Trending:", JSON.stringify(trendingProducts.rows[0], null, 2));
        console.log("\nFirst Offer:", JSON.stringify(offerProducts.rows[0], null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
