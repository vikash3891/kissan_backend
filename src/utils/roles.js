// ============================================================
// Kisaan Kart — Role & Permission Constants
// ============================================================
// Central source of truth for RBAC across the backend.
//
// NOTE: With the Enterprise Staff Management module, permissions
// are now DB-driven (see `permissions` / `role_permissions` tables
// and scripts/seed_rbac.js). The constants below serve two roles:
//
//   1. PERMISSIONS — canonical `module.action` keys referenced by
//      existing route files (e.g. verifyPermission(PERMISSIONS.PRODUCT_CREATE)).
//      The KEY NAMES are stable; only the string VALUES are the
//      canonical keys that match the seeded `permissions` table.
//
//   2. ROLES / ROLE_PERMISSIONS — a LEGACY static fallback matrix
//      used by verifyPermission ONLY when a token carries no
//      DB-driven `permissions[]` array (i.e. old customer/admin
//      tokens). New staff tokens carry real permissions and bypass
//      this matrix entirely.
// ============================================================

// ─── Roles ──────────────────────────────────────────────────

export const ROLES = Object.freeze({
    CUSTOMER:    'customer',
    MANAGER:     'manager',
    ADMIN:       'admin',
    SUPER_ADMIN: 'super_admin',
});

// Convenience arrays
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
export const STAFF_ROLES = [ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

// ─── Granular Permissions (canonical module.action keys) ────
// Values MUST match the seeded `permissions.permission_key` rows.

export const PERMISSIONS = Object.freeze({
    // Dashboard
    DASHBOARD_VIEW:     'dashboard.view',

    // Products
    PRODUCT_READ:       'products.view',
    PRODUCT_CREATE:     'products.create',
    PRODUCT_UPDATE:     'products.update',
    PRODUCT_DELETE:     'products.delete',

    // Inventory
    INVENTORY_VIEW:     'inventory.view',
    INVENTORY_UPDATE:   'inventory.update',

    // Categories
    CATEGORY_READ:      'categories.view',
    CATEGORY_CREATE:    'categories.create',
    CATEGORY_UPDATE:    'categories.update',
    CATEGORY_DELETE:    'categories.delete',

    // Orders
    ORDERS_VIEW:        'orders.view',
    ORDERS_UPDATE:      'orders.update',
    ORDERS_CANCEL:      'orders.cancel',
    ORDERS_REFUND:      'orders.refund',

    // Customers
    CUSTOMERS_VIEW:     'customers.view',
    CUSTOMERS_UPDATE:   'customers.update',

    // Coupons
    COUPONS_MANAGE:     'coupons.update',   // legacy alias → maps to update
    COUPONS_VIEW:       'coupons.view',
    COUPONS_CREATE:     'coupons.create',
    COUPONS_UPDATE:     'coupons.update',
    COUPONS_DELETE:     'coupons.delete',

    // Banners
    BANNER_MANAGE:      'banners.update',   // legacy alias → maps to update
    BANNER_VIEW:        'banners.view',
    BANNER_CREATE:      'banners.create',
    BANNER_UPDATE:      'banners.update',
    BANNER_DELETE:      'banners.delete',

    // Reports
    REPORTS_VIEW:       'reports.view',
    REPORTS_EXPORT:     'reports.export',

    // Users (legacy customer-management) — mapped to customers.*
    USERS_VIEW:         'customers.view',
    USERS_MANAGE:       'customers.update',

    // Staff
    STAFF_VIEW:         'staff.view',
    STAFF_CREATE:       'staff.create',
    STAFF_UPDATE:       'staff.update',
    STAFF_DELETE:       'staff.delete',
    STAFF_PERMISSIONS:  'staff.permissions',

    // Roles
    ROLES_VIEW:         'roles.view',
    ROLES_CREATE:       'roles.create',
    ROLES_UPDATE:       'roles.update',
    ROLES_DELETE:       'roles.delete',
    ROLES_MANAGE:       'roles.update',     // legacy alias

    // Settings
    SETTINGS_VIEW:      'settings.view',
    SETTINGS_UPDATE:    'settings.update',
    SETTINGS_MANAGE:    'settings.update',  // legacy alias

    // Stores
    STORES_VIEW:        'stores.view',
    STORES_MANAGE:      'stores.manage',

    // Sessions
    SESSIONS_VIEW:      'sessions.view',
    SESSIONS_REVOKE:    'sessions.revoke',
});

// ─── LEGACY Permission Matrix (fallback only) ───────────────
// Used by verifyPermission ONLY for tokens without a DB-driven
// permissions[] array. Keys use the canonical values above.

export const ROLE_PERMISSIONS = Object.freeze({

    [ROLES.CUSTOMER]: [
        // Customers use public routes only; no admin permissions.
    ],

    [ROLES.MANAGER]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_UPDATE,
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
    ],

    [ROLES.ADMIN]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.PRODUCT_DELETE,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_UPDATE,
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_CREATE,
        PERMISSIONS.CATEGORY_UPDATE,
        PERMISSIONS.CATEGORY_DELETE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
        PERMISSIONS.COUPONS_UPDATE,
        PERMISSIONS.BANNER_UPDATE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_MANAGE,
    ],

    // super_admin is granted allow-all directly in the middleware,
    // but we also enumerate here for completeness.
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
});

// ─── Helper ─────────────────────────────────────────────────

/**
 * Normalize a DB role NAME into a JWT role SLUG.
 *   "Super Admin"   → "super_admin"
 *   "Store Manager" → "store_manager"
 * Keeps the middleware's `super_admin` allow-all + `requireSuperAdmin`
 * checks working against dynamic, human-readable role names.
 * @param {string} roleName
 * @returns {string}
 */
export const roleSlug = (roleName) => {
    if (!roleName) return '';
    return roleName.trim().toLowerCase().replace(/\s+/g, '_');
};

/**
 * Legacy role-based permission check (static matrix).
 * @param {string} role  – e.g. 'admin'
 * @param {string} perm  – e.g. 'products.create'
 * @returns {boolean}
 */
export const hasPermission = (role, perm) => {
    if (role === ROLES.SUPER_ADMIN) return true;
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    return perms.includes(perm);
};
