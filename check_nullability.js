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
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name IN ('order_items', 'reviews', 'cart', 'wishlist') 
      AND column_name = 'product_id'
    `);
    console.log('Nullability of product_id:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
