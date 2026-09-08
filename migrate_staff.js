import 'dotenv/config';
import pool from './src/db/index.js';

async function migrate() {
  try {
    console.log('Adding dob and gender columns to staff_users table...');
    await pool.query(`
      ALTER TABLE staff_users 
      ADD COLUMN IF NOT EXISTS dob DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
    `);
    console.log('Columns added successfully.');

    // Login History
    const historyRes = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'staff_login_history';
    `);
    if (historyRes.rows.length === 0) {
        console.log('staff_login_history table not found, creating it...');
        await pool.query(`
          CREATE TABLE staff_login_history (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES staff_users(id) ON DELETE CASCADE,
            device_name VARCHAR(255),
            browser VARCHAR(255),
            os VARCHAR(255),
            ip_address VARCHAR(45),
            status VARCHAR(50),
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
    }

    // Audit Log
    const auditRes = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'staff_audit_logs';
    `);
    if (auditRes.rows.length === 0) {
        console.log('staff_audit_logs table not found, creating it...');
        await pool.query(`
          CREATE TABLE staff_audit_logs (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES staff_users(id) ON DELETE CASCADE,
            action VARCHAR(255),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
