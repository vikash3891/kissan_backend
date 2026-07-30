// ============================================================
// Kisaan Kart — RBAC / Staff Management Seed
// ============================================================
// Idempotent seed for the Enterprise Staff Management module.
//   • Default store
//   • Full permission catalog (module.action keys)
//   • 12 default SYSTEM roles + their permission matrix
//   • Migrates the existing customer-table admin into
//     staff_users as Super Admin
//
// Safe to run repeatedly (INSERT ... ON CONFLICT DO NOTHING).
//   Run:  npm run seed:rbac
// ============================================================

import "dotenv/config";
import pool from "../src/db/index.js";

// ─── Permission catalog ─────────────────────────────────────
// key = `${module}.${action}`. This is the single source of
// truth for the permissions table (mirrored by src/utils/roles.js).
const PERMISSION_CATALOG = [
    ["dashboard", "view",    "View the dashboard"],

    ["products", "view",     "View products"],
    ["products", "create",   "Create products"],
    ["products", "update",   "Update products"],
    ["products", "delete",   "Delete products"],

    ["categories", "view",   "View categories"],
    ["categories", "create", "Create categories"],
    ["categories", "update", "Update categories"],
    ["categories", "delete", "Delete categories"],

    ["orders", "view",       "View orders"],
    ["orders", "update",     "Update orders"],
    ["orders", "cancel",     "Cancel orders"],
    ["orders", "refund",     "Refund orders"],

    ["inventory", "view",    "View inventory"],
    ["inventory", "update",  "Update inventory / stock"],

    ["customers", "view",    "View customers"],
    ["customers", "update",  "Update customers"],

    ["coupons", "view",      "View coupons"],
    ["coupons", "create",    "Create coupons"],
    ["coupons", "update",    "Update coupons"],
    ["coupons", "delete",    "Delete coupons"],

    ["banners", "view",      "View banners"],
    ["banners", "create",    "Create banners"],
    ["banners", "update",    "Update banners"],
    ["banners", "delete",    "Delete banners"],

    ["reports", "view",      "View reports"],
    ["reports", "export",    "Export reports"],

    ["staff", "view",        "View staff"],
    ["staff", "create",      "Create staff"],
    ["staff", "update",      "Update staff"],
    ["staff", "delete",      "Permanently delete staff"],
    ["staff", "permissions", "Assign staff permissions"],

    ["roles", "view",        "View roles"],
    ["roles", "create",      "Create roles"],
    ["roles", "update",      "Update roles"],
    ["roles", "delete",      "Delete roles"],

    ["settings", "view",     "View settings"],
    ["settings", "update",   "Update settings"],

    ["stores", "view",       "View stores"],
    ["stores", "manage",     "Manage stores"],

    ["sessions", "view",     "View login sessions"],
    ["sessions", "revoke",   "Revoke login sessions"],
];

const keysFor = (...modules) =>
    PERMISSION_CATALOG
        .filter(([m]) => modules.includes(m))
        .map(([m, a]) => `${m}.${a}`);

const ALL_KEYS = PERMISSION_CATALOG.map(([m, a]) => `${m}.${a}`);

// ─── Default system roles + permission matrix ───────────────
// value: array of permission keys, or "*" for all.
const ROLE_MATRIX = {
    "Super Admin": {
        description: "Full unrestricted access to everything.",
        permissions: "*",
    },
    "Admin": {
        description: "Full operational access; cannot manage roles, global settings or stores.",
        permissions: ALL_KEYS.filter(k =>
            !["roles.create", "roles.update", "roles.delete",
              "settings.update", "stores.manage", "staff.delete"].includes(k)
        ),
    },
    "Manager": {
        description: "Manages catalog, orders and inventory.",
        permissions: [
            "dashboard.view",
            ...keysFor("products", "categories"),
            "orders.view", "orders.update", "orders.cancel",
            ...keysFor("inventory"),
            "customers.view",
            "reports.view",
        ],
    },
    "Store Manager": {
        description: "Runs a single store's catalog, inventory and orders.",
        permissions: [
            "dashboard.view",
            "products.view", "products.update",
            "categories.view",
            ...keysFor("inventory"),
            "orders.view", "orders.update",
            "customers.view",
            "reports.view",
            "staff.view",
        ],
    },
    "Inventory Manager": {
        description: "Manages stock levels and inventory.",
        permissions: [
            "dashboard.view",
            ...keysFor("inventory"),
            "products.view",
            "categories.view",
        ],
    },
    "Sales Manager": {
        description: "Owns sales, orders, coupons and reporting.",
        permissions: [
            "dashboard.view",
            "orders.view", "orders.update", "orders.cancel", "orders.refund",
            "coupons.view", "coupons.create", "coupons.update",
            "customers.view",
            "reports.view", "reports.export",
        ],
    },
    "Delivery Manager": {
        description: "Oversees order fulfilment and delivery.",
        permissions: [
            "dashboard.view",
            "orders.view", "orders.update",
            "customers.view",
        ],
    },
    "Receptionist": {
        description: "Front-desk: looks up orders and customers.",
        permissions: [
            "dashboard.view",
            "orders.view",
            "customers.view",
        ],
    },
    "Cashier": {
        description: "Processes orders at point of sale.",
        permissions: [
            "dashboard.view",
            "orders.view", "orders.update",
            "customers.view",
        ],
    },
    "Support Executive": {
        description: "Handles customer support tickets and orders.",
        permissions: [
            "dashboard.view",
            "orders.view",
            "customers.view", "customers.update",
        ],
    },
    "Customer Care": {
        description: "Customer relationship and query handling.",
        permissions: [
            "dashboard.view",
            "orders.view",
            "customers.view", "customers.update",
        ],
    },
    "Delivery Partner": {
        description: "Delivers orders; updates delivery status only.",
        permissions: [
            "orders.view", "orders.update",
        ],
    },
};

async function run() {
    const client = await pool.connect();
    console.log("============================================");
    console.log(" RBAC / Staff Management Seed");
    console.log("============================================");

    try {
        await client.query("BEGIN");

        // ── 1. Default store (name-idempotent) ─────────────────
        const DEFAULT_STORE_NAME = "Kisaan Kart — Default Store";
        await client.query(
            `INSERT INTO stores (name, address)
             SELECT $1, $2
             WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = $1)`,
            [DEFAULT_STORE_NAME, "Head Office"]
        );
        const storeRes = await client.query(
            `SELECT id FROM stores WHERE name = $1 ORDER BY id ASC LIMIT 1`,
            [DEFAULT_STORE_NAME]
        );
        const defaultStoreId = storeRes.rows[0]?.id;

        // ── 2. Permissions ─────────────────────────────────────
        for (const [module, action, description] of PERMISSION_CATALOG) {
            await client.query(
                `INSERT INTO permissions (permission_key, module, action, description)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (permission_key) DO NOTHING`,
                [`${module}.${action}`, module, action, description]
            );
        }

        // build key → id map
        const permRows = await client.query(`SELECT id, permission_key FROM permissions`);
        const permIdByKey = new Map(permRows.rows.map(r => [r.permission_key, r.id]));

        // ── 3. Roles + role_permissions ────────────────────────
        for (const [roleName, cfg] of Object.entries(ROLE_MATRIX)) {
            await client.query(
                `INSERT INTO roles (name, description, is_system, store_id)
                 VALUES ($1, $2, TRUE, $3)
                 ON CONFLICT (name) DO NOTHING`,
                [roleName, cfg.description, defaultStoreId]
            );

            const roleRow = await client.query(
                `SELECT id FROM roles WHERE name = $1`,
                [roleName]
            );
            const roleId = roleRow.rows[0].id;

            const keys = cfg.permissions === "*" ? ALL_KEYS : cfg.permissions;
            for (const key of keys) {
                const permId = permIdByKey.get(key);
                if (!permId) {
                    console.warn(`  ! unknown permission key in matrix: ${key}`);
                    continue;
                }
                await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [roleId, permId]
                );
            }
            console.log(`  ✓ role "${roleName}" (${keys.length} permissions)`);
        }

        // ── 4. Migrate existing admin into staff_users ─────────
        const superAdmin = await client.query(
            `SELECT id FROM roles WHERE name = 'Super Admin'`
        );
        const superAdminId = superAdmin.rows[0].id;

        const existingAdmins = await client.query(
            `SELECT id, phone FROM users WHERE role IN ('admin', 'super_admin')`
        );
        for (const admin of existingAdmins.rows) {
            const inserted = await client.query(
                `INSERT INTO staff_users
                    (name, phone, role_id, store_id, is_active, is_invited, is_archived)
                 VALUES ($1, $2, $3, $4, TRUE, FALSE, FALSE)
                 ON CONFLICT (phone) DO NOTHING
                 RETURNING id`,
                ["Administrator", admin.phone, superAdminId, defaultStoreId]
            );
            if (inserted.rowCount > 0) {
                console.log(`  ✓ migrated admin ${admin.phone} → staff_users (Super Admin)`);
            } else {
                console.log(`  • admin ${admin.phone} already present in staff_users`);
            }
        }
        if (existingAdmins.rows.length === 0) {
            console.log("  • no admin found in users table to migrate");
        }

        await client.query("COMMIT");
        console.log("✓ Seed completed successfully.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("✗ Seed failed, rolled back:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

run();
