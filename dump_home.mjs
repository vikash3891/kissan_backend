import "dotenv/config";
import { getHomeData } from "./src/controllers/home.controller.js";
import pool from "./src/db/index.js";
import fs from "fs";

async function run() {
    const req = {};
    const res = {
        status: (code) => ({
            json: (data) => {
                fs.writeFileSync("home_response.json", JSON.stringify(data, null, 2));
            }
        })
    };
    const next = (err) => {
        console.error("CAUGHT ERROR:", err);
    };
    await getHomeData(req, res, next);
    await pool.end();
}
run();
