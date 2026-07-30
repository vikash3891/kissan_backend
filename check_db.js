import pool from './src/db/index.js';
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_login_history'").then(res => {
    console.log(res.rows);
    process.exit(0);
});
