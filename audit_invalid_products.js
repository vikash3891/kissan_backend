import pg from 'pg';
const { Client } = pg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'kisaan_kart',
  password: 'Yash@123',
  port: 5432,
});

async function run() {
  await client.connect();
  try {
    // Step 1: Find all zero/invalid price products
    const invalidProducts = await client.query(`
      SELECT id, name, price, discount_price, is_available
      FROM products
      WHERE price <= 0 OR discount_price <= 0
    `);
    console.log(`Found ${invalidProducts.rows.length} invalid products:`);
    invalidProducts.rows.forEach(p => console.log(`  id=${p.id} name="${p.name}" price=${p.price} discount_price=${p.discount_price}`));

    // Step 2: Find which of these are linked to historical orders
    const invalidIds = invalidProducts.rows.map(p => p.id);
    if (invalidIds.length === 0) {
      console.log('No invalid products found. DB is clean!');
      return;
    }

    const linkedToOrders = await client.query(`
      SELECT DISTINCT product_id FROM order_items WHERE product_id = ANY($1)
    `, [invalidIds]);
    const orderLinkedIds = new Set(linkedToOrders.rows.map(r => r.product_id));
    console.log(`\nProducts linked to orders (will REPAIR, not delete): [${[...orderLinkedIds].join(', ')}]`);

    const linkedToReviews = await client.query(`
      SELECT DISTINCT product_id FROM reviews WHERE product_id = ANY($1)
    `, [invalidIds]);
    const reviewLinkedIds = new Set(linkedToReviews.rows.map(r => r.product_id));
    console.log(`Products linked to reviews (will try to REPAIR): [${[...reviewLinkedIds].join(', ')}]`);

    const unlinkedIds = invalidIds.filter(id => !orderLinkedIds.has(id));
    console.log(`\nProducts NOT in any order (safe to archive/delete): [${unlinkedIds.join(', ')}]`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
