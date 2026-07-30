// ============================================================
// Kisaan Kart — Store Repository
// ============================================================
// SQL against `stores` (multi-store readiness — enh #1).
// ============================================================

import pool from "../db/index.js";

/** List stores (active first, then by name). */
export const list = async ({ activeOnly = false } = {}) => {
    const { rows } = await pool.query(
        `SELECT id, name, address, is_active, created_at, updated_at
         FROM stores
         ${activeOnly ? "WHERE is_active = TRUE" : ""}
         ORDER BY is_active DESC, name ASC`
    );
    return rows;
};

/** Fetch one store by id. */
export const findById = async (id) => {
    const { rows } = await pool.query(
        `SELECT id, name, address, is_active, created_at, updated_at
         FROM stores WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
};

/** Create a store (name-unique). */
export const create = async ({ name, address = null }) => {
    const { rows } = await pool.query(
        `INSERT INTO stores (name, address)
         VALUES ($1, $2)
         RETURNING id, name, address, is_active, created_at, updated_at`,
        [name, address]
    );
    return rows[0];
};

export const getPrimaryStore = async () => {
    const { rows } = await pool.query(`SELECT * FROM stores ORDER BY id LIMIT 1`);
    return rows[0] || null;
};

export const updateStore = async (id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return null;

    const setClause = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
    const values = fields.map(field => data[field]);
    values.unshift(id); // $1

    const { rows } = await pool.query(
        `UPDATE stores SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
    );
    return rows[0] || null;
};

export const logAuditChange = async (storeId, changedBy, changes) => {
    await pool.query(
        `INSERT INTO store_audit_logs (store_id, changed_by, changes) VALUES ($1, $2, $3)`,
        [storeId, changedBy, JSON.stringify(changes)]
    );
};

export const getAuditHistory = async (storeId, limit = 50) => {
    const { rows } = await pool.query(
        `SELECT l.id, l.store_id, l.changed_by, l.changes, l.created_at, u.first_name, u.last_name
         FROM store_audit_logs l
         LEFT JOIN users u ON l.changed_by = u.id
         WHERE l.store_id = $1
         ORDER BY l.created_at DESC
         LIMIT $2`,
        [storeId, limit]
    );
    return rows;
};

export const updateMediaUrl = async (storeId, mediaType, url, publicId) => {
    const urlCol = `${mediaType}_url`;
    const pubIdCol = `${mediaType}_public_id`;
    const { rows } = await pool.query(
        `UPDATE stores SET ${urlCol} = $2, ${pubIdCol} = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [storeId, url, publicId]
    );
    return rows[0] || null;
};

export const clearMediaUrl = async (storeId, mediaType) => {
    const urlCol = `${mediaType}_url`;
    const pubIdCol = `${mediaType}_public_id`;
    const { rows } = await pool.query(
        `UPDATE stores SET ${urlCol} = NULL, ${pubIdCol} = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [storeId]
    );
    return rows[0] || null;
};

export default { list, findById, create, getPrimaryStore, updateStore, logAuditChange, getAuditHistory, updateMediaUrl, clearMediaUrl };
