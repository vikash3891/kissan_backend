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
    const productSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    console.log('Products columns:', productSchema.rows);
    
    // Check constraints
    const fks = await client.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name='products';
    `);
    console.log('Tables dependent on products:', fks.rows);

  } catch (err) {
    console.error('Error querying:', err);
  } finally {
    await client.end();
  }
}
check();
