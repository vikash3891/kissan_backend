import "dotenv/config";
import pool from "../src/db/index.js";

async function runMigration() {
  const client = await pool.connect();
  console.log("Starting Migration for Soft Enable/Disable & Trash...");

  try {
    await client.query("BEGIN");

    // 1. Alter Products Table
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 2. Alter Categories Table
    await client.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    
    await client.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 3. Update Existing Data (Idempotent)
    await client.query(`
      UPDATE products 
      SET is_active = TRUE 
      WHERE is_active IS NULL;
    `);

    await client.query(`
      UPDATE products 
      SET is_archived = FALSE 
      WHERE is_archived IS NULL;
    `);

    await client.query(`
      UPDATE categories 
      SET is_active = TRUE 
      WHERE is_active IS NULL;
    `);

    await client.query(`
      UPDATE categories 
      SET is_archived = FALSE 
      WHERE is_archived IS NULL;
    `);

    // 4. Create Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_is_archived ON categories(is_archived);
    `);

    // 5. Create Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_state JSONB,
        new_state JSONB,
        admin_id INTEGER,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Restore Accidentally Disabled Categories (Fix existing issue)
    const restoreResult = await client.query(`
      UPDATE categories 
      SET is_active = TRUE, is_archived = FALSE 
      WHERE is_active = FALSE OR is_archived = TRUE;
    `);
    console.log(`Restored ${restoreResult.rowCount} disabled categories.`);

    await client.query("COMMIT");
    console.log("Migration completed successfully!");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolling back:", error);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
