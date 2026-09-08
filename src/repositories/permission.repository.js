// ============================================================
// Kisaan Kart — Permission Repository
// ============================================================
// Read-only access to the `permissions` catalog. Permissions are
// seeded (see scripts/seed_rbac.js) and not mutated at runtime.
// ============================================================

import pool from "../db/index.js";

/** All permissions, flat. */
export const listAll = async () => {
    const { rows } = await pool.query(
        `SELECT id, permission_key, module, action, description
         FROM permissions
         ORDER BY module, action`
    );
    return rows;
};

/** All permissions grouped by module (for a data-driven matrix UI — enh #11). */
export const listGrouped = async () => {
    const all = await listAll();
    const grouped = {};
    for (const p of all) {
        (grouped[p.module] ??= []).push(p);
    }
    return Object.entries(grouped).map(([module, permissions]) => ({
        module,
        permissions,
    }));
};

/** Validate a set of permission ids; returns the ones that exist. */
export const findExistingIds = async (ids = []) => {
    if (!ids.length) return [];
    const { rows } = await pool.query(
        `SELECT id FROM permissions WHERE id = ANY($1::int[])`,
        [ids]
    );
    return rows.map(r => r.id);
};

export default { listAll, listGrouped, findExistingIds };
