// ============================================================
// Kisaan Kart — Activity Log Repository
// ============================================================
// Owns all SQL against `activity_logs` (staff audit trail, enh #10).
// ============================================================

import pool from "../db/index.js";

/** Insert an activity-log entry. */
export const insert = async ({
    staffId = null, action, module = null, entity = null, entityId = null,
    oldValue = null, newValue = null,
    ipAddress = null, device = null, browser = null, location = null,
}) => {
    const { rows } = await pool.query(
        `INSERT INTO activity_logs
            (staff_id, action, module, entity, entity_id,
             old_value, new_value, ip_address, device, browser, location)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, created_at`,
        [
            staffId, action, module, entity, entityId,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress, device, browser, location,
        ]
    );
    return rows[0];
};

/** Paginated, filterable listing (search / staff / action / date range). */
export const list = async ({
    page = 1, limit = 20, search = null, staffId = null, action = null,
    from = null, to = null,
}) => {
    const clauses = [];
    const params = [];
    let i = 1;

    if (staffId) { clauses.push(`al.staff_id = $${i++}`); params.push(staffId); }
    if (action)  { clauses.push(`al.action ILIKE $${i++}`); params.push(`%${action}%`); }
    if (from)    { clauses.push(`al.created_at >= $${i++}`); params.push(from); }
    if (to)      { clauses.push(`al.created_at <= $${i++}`); params.push(to); }
    if (search)  {
        clauses.push(`(al.action ILIKE $${i} OR al.module ILIKE $${i} OR al.entity ILIKE $${i} OR su.name ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM activity_logs al
         LEFT JOIN staff_users su ON su.id = al.staff_id
         ${where}`,
        params
    );

    const dataRes = await pool.query(
        `SELECT al.*, su.name AS staff_name, su.phone AS staff_phone
         FROM activity_logs al
         LEFT JOIN staff_users su ON su.id = al.staff_id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
        [...params, limit, offset]
    );

    return {
        items: dataRes.rows,
        total: countRes.rows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countRes.rows[0].total / limit) || 1,
    };
};

export default { insert, list };
