// ============================================================
// Kisaan Kart — Staff Dashboard Controller (enh #10)
// ============================================================
// Returns permission-aware dashboard widgets. The response only
// includes sections the caller's JWT permissions allow them to see.
//
//   GET /api/admin/staff-dashboard
//
// Each widget is a self-contained block of data. The Flutter UI
// simply renders whatever widgets the API returns.
// ============================================================

import pool from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Permission → Widget mapping ────────────────────────────
// Each entry defines: the permission key required, a widget key
// for the frontend, a human label, and an async data fetcher.

const WIDGET_DEFS = [
    // ── Inventory widgets ────────────────────────────────────
    {
        permission: "inventory.view",
        key: "low_stock_alerts",
        label: "Low Stock Alerts",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT p.id, p.name, p.stock, p.price, c.name AS category
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.stock > 0 AND p.stock <= 10
                ORDER BY p.stock ASC
                LIMIT 10
            `);
            return rows;
        },
    },
    {
        permission: "inventory.view",
        key: "out_of_stock",
        label: "Out of Stock Products",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT p.id, p.name, p.price, c.name AS category
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.stock = 0
                ORDER BY p.updated_at DESC
                LIMIT 10
            `);
            return rows;
        },
    },
    {
        permission: "inventory.view",
        key: "recent_stock_updates",
        label: "Recent Stock Updates",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT p.id, p.name, p.stock, p.updated_at
                FROM products p
                ORDER BY p.updated_at DESC
                LIMIT 10
            `);
            return rows;
        },
    },

    // ── Order widgets ────────────────────────────────────────
    {
        permission: "orders.view",
        key: "pending_orders",
        label: "Pending Orders",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT o.id, o.total_amount, o.final_amount, o.order_status,
                       o.created_at, u.phone AS customer_phone
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.order_status = 'pending'
                ORDER BY o.created_at ASC
                LIMIT 15
            `);
            return rows;
        },
    },
    {
        permission: "orders.view",
        key: "ready_to_ship",
        label: "Ready to Ship",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT o.id, o.total_amount, o.final_amount, o.order_status,
                       o.created_at, u.phone AS customer_phone
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.order_status IN ('confirmed', 'packed')
                ORDER BY o.created_at ASC
                LIMIT 15
            `);
            return rows;
        },
    },
    {
        permission: "orders.view",
        key: "cancelled_orders",
        label: "Recently Cancelled",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT o.id, o.total_amount, o.final_amount,
                       o.created_at, u.phone AS customer_phone
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.order_status = 'cancelled'
                ORDER BY o.updated_at DESC
                LIMIT 10
            `);
            return rows;
        },
    },
    {
        permission: "orders.view",
        key: "today_order_stats",
        label: "Today's Order Summary",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE order_status = 'pending')   AS pending,
                    COUNT(*) FILTER (WHERE order_status = 'confirmed') AS confirmed,
                    COUNT(*) FILTER (WHERE order_status = 'delivered') AS delivered,
                    COUNT(*) FILTER (WHERE order_status = 'cancelled') AS cancelled,
                    COUNT(*)                                            AS total,
                    COALESCE(SUM(final_amount) FILTER (WHERE order_status != 'cancelled'), 0) AS revenue
                FROM orders
                WHERE DATE(created_at) = CURRENT_DATE
            `);
            return rows[0] || {};
        },
    },

    // ── Customer widgets ─────────────────────────────────────
    {
        permission: "customers.view",
        key: "recent_customers",
        label: "Recent Customers",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT u.id, u.phone, u.created_at,
                       COUNT(o.id) AS order_count
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                WHERE u.role = 'customer' OR u.role IS NULL
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT 10
            `);
            return rows;
        },
    },
    {
        permission: "customers.view",
        key: "customer_search_stats",
        label: "Customer Overview",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COUNT(*) AS total_customers,
                    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_new,
                    COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') AS week_new
                FROM users
                WHERE role = 'customer' OR role IS NULL
            `);
            return rows[0] || {};
        },
    },

    // ── Dashboard overview (general) ─────────────────────────
    {
        permission: "dashboard.view",
        key: "revenue_overview",
        label: "Revenue Overview",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COALESCE(SUM(final_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND order_status != 'cancelled'), 0) AS today_revenue,
                    COALESCE(SUM(final_amount) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) AND order_status != 'cancelled'), 0) AS monthly_revenue,
                    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_orders,
                    COUNT(*) FILTER (WHERE order_status = 'pending') AS pending_orders
                FROM orders
            `);
            return rows[0] || {};
        },
    },

    // ── Product widgets ──────────────────────────────────────
    {
        permission: "products.view",
        key: "product_stats",
        label: "Product Statistics",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COUNT(*) AS total_products,
                    COUNT(*) FILTER (WHERE is_active = TRUE) AS active_products,
                    COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive_products,
                    COUNT(*) FILTER (WHERE stock = 0) AS out_of_stock,
                    COUNT(*) FILTER (WHERE stock > 0 AND stock <= 10) AS low_stock
                FROM products
            `);
            return rows[0] || {};
        },
    },

    // ── Category widgets ─────────────────────────────────────
    {
        permission: "categories.view",
        key: "category_stats",
        label: "Category Statistics",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COUNT(*) AS total_categories,
                    COUNT(*) FILTER (WHERE is_active = TRUE) AS active_categories,
                    COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive_categories
                FROM categories
            `);
            return rows[0] || {};
        },
    },

    // ── Coupon widgets ───────────────────────────────────────
    {
        permission: "coupons.view",
        key: "active_coupons",
        label: "Active Coupons",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT code, discount_type, discount_value, min_order_amount,
                       usage_count, max_uses, expires_at
                FROM coupons
                WHERE is_active = TRUE
                  AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY usage_count DESC
                LIMIT 10
            `);
            return rows;
        },
    },

    // ── Staff widgets (admin only) ───────────────────────────
    {
        permission: "staff.view",
        key: "staff_overview",
        label: "Staff Overview",
        fetch: async () => {
            const { rows } = await pool.query(`
                SELECT
                    COUNT(*) AS total_staff,
                    COUNT(*) FILTER (WHERE is_active = TRUE AND is_archived = FALSE) AS active_staff,
                    COUNT(*) FILTER (WHERE is_active = FALSE) AS disabled_staff,
                    COUNT(*) FILTER (WHERE is_archived = TRUE) AS archived_staff,
                    COUNT(*) FILTER (WHERE is_invited = TRUE AND last_login IS NULL) AS pending_invites,
                    COUNT(*) FILTER (WHERE locked_until IS NOT NULL AND locked_until > NOW()) AS locked_accounts
                FROM staff_users
            `);
            return rows[0] || {};
        },
    },
];

// ─── Controller ─────────────────────────────────────────────

export const getStaffDashboard = asyncHandler(async (req, res) => {
    const user = req.user;
    const userPerms = user?.permissions || [];
    const isSuperAdmin = user?.role === "super_admin";

    // Build widgets in parallel — only those the user may see.
    const eligible = WIDGET_DEFS.filter(
        (w) => isSuperAdmin || userPerms.includes(w.permission)
    );

    const results = await Promise.allSettled(
        eligible.map(async (w) => ({
            key: w.key,
            label: w.label,
            permission: w.permission,
            data: await w.fetch(),
        }))
    );

    const widgets = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

    // Also include failed widget keys so the UI knows something went wrong.
    const errors = results
        .filter((r) => r.status === "rejected")
        .map((r, i) => ({
            key: eligible[i]?.key,
            error: r.reason?.message || "Unknown error",
        }));

    res.status(200).json(
        new ApiResponse(200, { widgets, errors }, "Staff dashboard loaded")
    );
});

export default { getStaffDashboard };
