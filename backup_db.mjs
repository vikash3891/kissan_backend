import "dotenv/config";
import pool from "./src/db/index.js";
import fs from "fs";
import { execSync } from "child_process";

async function run() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `./backup_${timestamp}`;
    fs.mkdirSync(backupDir);

    const tables = ['categories', 'products', 'reviews', 'orders', 'order_items', 'coupons', 'wishlist', 'cart', 'addresses', 'banners'];
    
    console.log(`Starting database backup to ${backupDir}...`);

    for (const table of tables) {
        try {
            const check = await pool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`, [table]);
            if (check.rows[0].exists) {
                const res = await pool.query(`SELECT * FROM ${table}`);
                fs.writeFileSync(`${backupDir}/${table}.json`, JSON.stringify(res.rows, null, 2));
                console.log(`Backed up ${table}: ${res.rows.length} records.`);
            } else {
                console.log(`Skipped ${table}: table does not exist.`);
            }
        } catch (e) {
            console.error(`Failed to backup ${table}:`, e.message);
        }
    }
    await pool.end();
    console.log(`Backup complete. Saved in ${backupDir}/`);
}
run();
