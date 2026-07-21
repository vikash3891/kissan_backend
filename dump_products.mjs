import "dotenv/config";
import pool from "./src/db/index.js";
import fs from "fs";

async function run() {
    try {
        const res = await pool.query("SELECT id, name, category, image_url FROM products ORDER BY id ASC");
        fs.writeFileSync("products_dump.json", JSON.stringify(res.rows, null, 2));
        console.log(`Dumped ${res.rows.length} products to products_dump.json`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
