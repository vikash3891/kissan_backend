import dotenv from "dotenv";
dotenv.config();
import pool from "./src/db/index.js";

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'banners'
    `);
        console.log("Columns:", res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}
run();
