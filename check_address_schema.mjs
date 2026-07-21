import "dotenv/config";
import pool from "./src/db/index.js";

async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'addresses'");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
