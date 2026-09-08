import "dotenv/config";
import pool from "./src/db/index.js";

async function run() {
    try {
        const categories = await pool.query("SELECT id, name FROM categories");
        console.log("Existing categories:", categories.rows);
        
        const products = await pool.query("SELECT COUNT(*) FROM products");
        console.log("Total existing products:", products.rows[0].count);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}
run();
