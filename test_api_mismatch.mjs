import "dotenv/config";
import pool from "./src/db/index.js";
import { PRODUCT_SELECT } from "./src/utils/productQuery.js";

async function run() {
    try {
        console.log("Testing Home API Products Query...");
        const homeRes = await pool.query(`SELECT * FROM products WHERE is_available = true ORDER BY created_at DESC LIMIT 1`);
        const homeProduct = homeRes.rows[0];
        console.log("Home Product Category Type:", typeof homeProduct.category);
        console.log("Home Product Category Value:", homeProduct.category);

        console.log("\nTesting Products API Query (PRODUCT_SELECT)...");
        const prodRes = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [homeProduct.id]);
        const apiProduct = prodRes.rows[0];
        console.log("Products API Category Type:", typeof apiProduct.category);
        console.log("Products API Category Value:", JSON.stringify(apiProduct.category));

        if (typeof homeProduct.category !== typeof apiProduct.category) {
            console.log("\n[MISMATCH DETECTED] The APIs return fundamentally different types for 'category'.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
