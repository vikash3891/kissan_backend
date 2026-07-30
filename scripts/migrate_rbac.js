// ============================================================
// Kisaan Kart — RBAC / Staff Management Migration
// ============================================================
// Idempotent, transactional migration that provisions the
// Enterprise Staff Management + RBAC schema.
//
//   Tables: schema_migrations, stores, roles, permissions,
//           role_permissions, staff_users, staff_otps,
//           staff_sessions, activity_logs
//
// Safe to run repeatedly — every statement uses
// CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS and the
// migration records itself in schema_migrations so re-runs no-op.
//
//   Run:  npm run migrate:rbac
// ============================================================

import "dotenv/config";
import pool from "../src/db/index.js";

const MIGRATION_VERSION = "2026_07_27_001_rbac_staff_management";

async function runMigration() {
    const client = await pool.connect();
    console.log("============================================");
    console.log(" RBAC / Staff Management Migration");
    console.log(`  version: ${MIGRATION_VERSION}`);
    console.log("============================================");

    try {
        await client.query("BEGIN");

        // ── 0. Migration history table (enh #14) ──────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version    VARCHAR(255) PRIMARY KEY,
                name       VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const already = await client.query(
            `SELECT 1 FROM schema_migrations WHERE version = $1`,
            [MIGRATION_VERSION]
        );
        if (already.rowCount > 0) {
            await client.query("COMMIT");
            console.log(`✓ Migration ${MIGRATION_VERSION} already applied — nothing to do.`);
            return;
        }

        // ── 1. Stores (enh #1 — multi-store readiness) ─────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id         SERIAL PRIMARY KEY,
                name       VARCHAR(150) NOT NULL,
                address    TEXT,
                is_active  BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_stores_name ON stores(name);
        `);

        // ── 2. Roles ───────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id                  SERIAL PRIMARY KEY,
                name                VARCHAR(100) NOT NULL UNIQUE,
                description         TEXT,
                is_system           BOOLEAN NOT NULL DEFAULT FALSE,
                is_active           BOOLEAN NOT NULL DEFAULT TRUE,
                store_id            INTEGER REFERENCES stores(id) ON DELETE SET NULL,
                permissions_version INTEGER NOT NULL DEFAULT 1,
                created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ── 3. Permissions ─────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                id             SERIAL PRIMARY KEY,
                permission_key VARCHAR(100) NOT NULL UNIQUE,
                module         VARCHAR(60)  NOT NULL,
                action         VARCHAR(60)  NOT NULL,
                description    TEXT,
                created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ── 4. Role ↔ Permission join ──────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );
        `);

        // ── 5. Staff users ─────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS staff_users (
                id               SERIAL PRIMARY KEY,
                name             VARCHAR(150) NOT NULL,
                phone            VARCHAR(20)  NOT NULL UNIQUE,
                email            VARCHAR(150),
                role_id          INTEGER REFERENCES roles(id) ON DELETE SET NULL,
                store_id         INTEGER REFERENCES stores(id) ON DELETE SET NULL,
                profile_image    TEXT,
                designation      VARCHAR(120),
                department       VARCHAR(120),
                employee_id      VARCHAR(60),
                notes            TEXT,
                is_active        BOOLEAN NOT NULL DEFAULT TRUE,
                is_archived      BOOLEAN NOT NULL DEFAULT FALSE,
                is_invited       BOOLEAN NOT NULL DEFAULT TRUE,
                first_login_at   TIMESTAMP,
                last_login       TIMESTAMP,
                failed_otp_count INTEGER NOT NULL DEFAULT 0,
                locked_until     TIMESTAMP,
                refresh_token    TEXT,
                created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ── 6. Staff OTPs ──────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS staff_otps (
                id         SERIAL PRIMARY KEY,
                phone      VARCHAR(20) NOT NULL,
                otp_hash   VARCHAR(128) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                attempts   INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_staff_otps_phone_created
            ON staff_otps(phone, created_at);
        `);

        // ── 7. Staff sessions (enh #2) ─────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS staff_sessions (
                id                 SERIAL PRIMARY KEY,
                staff_id           INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
                refresh_token_hash VARCHAR(128) NOT NULL,
                device             VARCHAR(255),
                browser            VARCHAR(255),
                ip_address         VARCHAR(64),
                login_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at         TIMESTAMP,
                is_active          BOOLEAN NOT NULL DEFAULT TRUE,
                needs_refresh      BOOLEAN NOT NULL DEFAULT FALSE
            );
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_active
            ON staff_sessions(staff_id, is_active);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_staff_sessions_token_hash
            ON staff_sessions(refresh_token_hash);
        `);

        // ── 8. Activity logs (enh #10) ─────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id         SERIAL PRIMARY KEY,
                staff_id   INTEGER REFERENCES staff_users(id) ON DELETE SET NULL,
                action     VARCHAR(80) NOT NULL,
                module     VARCHAR(60),
                entity     VARCHAR(80),
                entity_id  INTEGER,
                old_value  JSONB,
                new_value  JSONB,
                ip_address VARCHAR(64),
                device     VARCHAR(255),
                browser    VARCHAR(255),
                location   VARCHAR(255),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_staff   ON activity_logs(staff_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_action  ON activity_logs(action);`);

        // ── Record migration ───────────────────────────────────
        await client.query(
            `INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`,
            [MIGRATION_VERSION, "RBAC + Staff Management schema"]
        );

        await client.query("COMMIT");
        console.log("✓ Migration completed successfully.");
        console.log("  Tables ready: stores, roles, permissions, role_permissions,");
        console.log("                staff_users, staff_otps, staff_sessions, activity_logs");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("✗ Migration failed, rolled back:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
