import "dotenv/config";
import axios from "axios";

async function run() {
    try {
        console.log("Fetching /api/home...");
        const homeRes = await axios.get("http://localhost:3000/api/home"); // Assuming standard port or we can hit the actual deployed API if it's deployed, but we can just use the db/controllers to see. Wait, I should start the backend or just query the DB directly to simulate it.
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
