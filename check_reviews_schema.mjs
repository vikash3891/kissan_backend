import "dotenv/config";
import pool from "./src/db/index.js";
const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' ORDER BY ordinal_position");
console.log("reviews columns:", JSON.stringify(r.rows, null, 2));
await pool.end();
