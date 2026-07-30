import pool from "../src/db/index.js";

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log("Creating notifications table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                reference_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating notification_reads table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notification_reads (
                id SERIAL PRIMARY KEY,
                notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(notification_id, user_id)
            )
        `);

        console.log("Creating notification_preferences table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                preferences JSONB NOT NULL DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating activities table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(100),
                entity_id VARCHAR(100),
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for efficient querying
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status)`);

        await client.query('COMMIT');
        console.log("Migration completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
