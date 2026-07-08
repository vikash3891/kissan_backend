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
    const res = await client.query('SELECT id, name FROM products');
    console.log('Products:', res.rows);
  } catch (err) {
    console.error('Error querying:', err);
  } finally {
    await client.end();
  }
}
check();
