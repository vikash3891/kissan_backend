import pg from 'pg';
const { Client } = pg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'kisaan_kart',
  password: 'Yash@123',
  port: 5432,
});

async function check() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
    `);
    console.log('order_items columns:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
