import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'ep-small-wind-adnoa40n.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_yh8zruHAwZL4',
  database: 'Kisaan_Kart',
  ssl: { rejectUnauthorized: false }
});

async function updateRoles() {
  await pool.query("UPDATE users SET role = 'super_admin' WHERE phone = '9876543210'");
  await pool.query("UPDATE users SET role = 'manager' WHERE phone = '9587430910'");
  await pool.query("UPDATE users SET role = 'customer' WHERE phone = '7742720664'");

  const users = await pool.query('SELECT id, phone, role FROM users ORDER BY id');
  console.log('UPDATED USERS TABLE:');
  console.table(users.rows);
  await pool.end();
}
updateRoles().catch(console.error);
