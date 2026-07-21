import "dotenv/config";
import pool from "./src/db/index.js";

async function run() {
    try {
        const tables = ['categories', 'products', 'users', 'reviews'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
            console.log(`\nTable: ${table}`);
            console.log(res.rows);
        }
    } catch (e) {
        console.error("Error querying schema:", e);
    } finally {
        await pool.end();
    }
}
run();
