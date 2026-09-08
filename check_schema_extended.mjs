import "dotenv/config";
import pool from "./src/db/index.js";

async function run() {
    try {
        const tables = [
            'orders', 'order_items', 'cart', 'cart_items', 'addresses', 
            'wishlist', 'wishlist_items', 'coupons', 'notifications', 'banners'
        ];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
            console.log(`\nTable: ${table}`);
            if (res.rows.length === 0) {
                console.log("NOT FOUND");
            } else {
                console.log(res.rows);
            }
        }
    } catch (e) {
        console.error("Error querying schema:", e);
    } finally {
        await pool.end();
    }
}
run();
