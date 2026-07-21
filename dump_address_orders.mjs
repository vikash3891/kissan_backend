import "dotenv/config";
import pool from "./src/db/index.js";
import { getMyAddresses } from "./src/controllers/address.controller.js";
import { getMyOrders } from "./src/controllers/order.controller.js";

async function run() {
    try {
        // find a user with addresses and orders
        const userRes = await pool.query("SELECT id FROM users LIMIT 1");
        const userId = userRes.rows[0].id;
        
        console.log("Testing with User ID:", userId);
        
        // Mock req, res
        const req = { user: { id: userId } };
        
        const resAddress = {
            status: (code) => ({
                json: (data) => console.log("\n--- ADDRESSES --- \n", JSON.stringify(data, null, 2))
            })
        };
        
        await getMyAddresses(req, resAddress);
        
        const resOrders = {
            status: (code) => ({
                json: (data) => console.log("\n--- ORDERS --- \n", JSON.stringify(data, null, 2))
            })
        };
        
        await getMyOrders(req, resOrders);
        
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
