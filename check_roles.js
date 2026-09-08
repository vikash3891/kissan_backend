import pg from 'pg';
const { Client } = pg;
const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_yh8zruHAwZL4@ep-small-wind-adnoa40n-pooler.c-2.us-east-1.aws.neon.tech/Kisaan_Kart?sslmode=require' 
});

await client.connect();
try {
  // Find the correct staff table name
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%staff%'"
  );
  console.log('Staff tables:', tables.rows);

  // Check roles table
  const roles = await client.query("SELECT * FROM roles ORDER BY id");
  console.log('Roles:', JSON.stringify(roles.rows, null, 2));

  // Try staff_users table
  const staffCheck = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('staff_users', 'staff_members', 'staffs')"
  );
  console.log('Staff-like tables:', staffCheck.rows);

  // Get all staff with roles
  for (const t of ['staff_users', 'staff_members', 'staffs']) {
    try {
      const res = await client.query(`SELECT s.*, r.name as role_name FROM ${t} s LEFT JOIN roles r ON s.role_id = r.id`);
      console.log(`${t} data:`, JSON.stringify(res.rows, null, 2));
    } catch(e) {
      // table doesn't exist, try next
    }
  }

} catch (e) {
  console.error(e.message);
}
await client.end();
