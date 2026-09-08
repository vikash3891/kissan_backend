// ============================================================
// Kisaan Kart — Role Repository
// ============================================================
// Owns all SQL against `roles` + `role_permissions`. Provides the
// permission-key resolution used at login, the version lookup used by
// the optional freshness guard, and full role CRUD.
// ============================================================

import pool from "../db/index.js";

/** Resolve a role's permission KEYS (['products.view', ...]) by role id. */
export const getPermissionKeys = async (roleId) => {
    if (!roleId) return [];
    const { rows } = await pool.query(
        `SELECT p.permission_key
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.permission_key`,
        [roleId]
    );
    return rows.map(r => r.permission_key);
};

/** Resolve a role's permission ROWS (id + key) by role id. */
export const getPermissions = async (roleId) => {
    if (!roleId) return [];
    const { rows } = await pool.query(
        `SELECT p.id, p.permission_key, p.module, p.action, p.description
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.module, p.action`,
        [roleId]
    );
    return rows;
};

/** Fetch a role row by id. */
export const findById = async (roleId) => {
    const { rows } = await pool.query(
        `SELECT id, name, description, is_system, is_active,
                store_id, permissions_version, created_at, updated_at
         FROM roles WHERE id = $1`,
        [roleId]
    );
    return rows[0] || null;
};

/** Fetch a role row by (case-insensitive) name. */
export const findByName = async (name) => {
    const { rows } = await pool.query(
        `SELECT * FROM roles WHERE LOWER(name) = LOWER($1)`,
        [name]
    );
    return rows[0] || null;
};

/** List all roles with permission + staff counts. */
export const list = async () => {
    const { rows } = await pool.query(
        `SELECT r.id, r.name, r.description, r.is_system, r.is_active,
                r.store_id, r.permissions_version, r.created_at, r.updated_at,
                COALESCE(pc.perm_count, 0)::int  AS permission_count,
                COALESCE(sc.staff_count, 0)::int AS staff_count
         FROM roles r
         LEFT JOIN (SELECT role_id, COUNT(*) AS perm_count  FROM role_permissions GROUP BY role_id) pc ON pc.role_id = r.id
         LEFT JOIN (SELECT role_id, COUNT(*) AS staff_count FROM staff_users     GROUP BY role_id) sc ON sc.role_id = r.id
         ORDER BY r.is_system DESC, r.name ASC`
    );
    return rows;
};

/** Lightweight version lookup for requireFreshPermissions middleware. */
export const getRoleVersion = async (roleId) => {
    if (!roleId) return null;
    const { rows } = await pool.query(
        `SELECT permissions_version FROM roles WHERE id = $1`,
        [roleId]
    );
    return rows[0]?.permissions_version ?? null;
};

/** Create a custom (non-system) role and assign permissions, transactionally. */
export const create = async ({ name, description, storeId = null, permissionIds = [] }) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const { rows } = await client.query(
            `INSERT INTO roles (name, description, is_system, store_id)
             VALUES ($1, $2, FALSE, $3)
             RETURNING id`,
            [name, description ?? null, storeId]
        );
        const roleId = rows[0].id;
        for (const pid of permissionIds) {
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id)
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [roleId, pid]
            );
        }
        await client.query("COMMIT");
        return findById(roleId);
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

/** Update role metadata (name / description / is_active). */
export const update = async (id, data) => {
    const fields = [];
    const params = [];
    let i = 1;
    const set = (col, val) => { fields.push(`${col} = $${i++}`); params.push(val); };

    if (data.name        !== undefined) set("name", data.name);
    if (data.description !== undefined) set("description", data.description);
    if (data.is_active   !== undefined) set("is_active", data.is_active);

    if (fields.length === 0) return findById(id);
    fields.push(`updated_at = NOW()`);
    params.push(id);
    await pool.query(`UPDATE roles SET ${fields.join(", ")} WHERE id = $${i}`, params);
    return findById(id);
};

/**
 * Replace a role's permission set and bump permissions_version, in one
 * transaction. Returns the new version.
 */
export const setPermissions = async (roleId, permissionIds) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
        for (const pid of permissionIds) {
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id)
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [roleId, pid]
            );
        }
        const { rows } = await client.query(
            `UPDATE roles
             SET permissions_version = permissions_version + 1, updated_at = NOW()
             WHERE id = $1
             RETURNING permissions_version`,
            [roleId]
        );
        await client.query("COMMIT");
        return rows[0]?.permissions_version ?? null;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

/** Delete a role (service blocks system/in-use roles first). */
export const remove = async (id) => {
    const { rows } = await pool.query(
        `DELETE FROM roles WHERE id = $1 RETURNING id`,
        [id]
    );
    return rows[0] || null;
};

export default {
    getPermissionKeys,
    getPermissions,
    findById,
    findByName,
    list,
    getRoleVersion,
    create,
    update,
    setPermissions,
    remove,
};
