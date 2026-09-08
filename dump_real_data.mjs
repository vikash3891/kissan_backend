import "dotenv/config";
import pool from "./src/db/index.js";


async function run() {
    try {
        const addressRes = await pool.query("SELECT * FROM addresses LIMIT 1");
        console.log("One Address:", JSON.stringify(addressRes.rows[0], null, 2));

        const orderRes = await pool.query("SELECT * FROM orders LIMIT 1");
        if (orderRes.rows.length > 0) {
            console.log("One Order:", JSON.stringify(orderRes.rows[0], null, 2));
            const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [orderRes.rows[0].id]);
            console.log("Order Items:", JSON.stringify(itemsRes.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
