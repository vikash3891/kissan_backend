// ============================================================
// Kisaan Kart — Staff Repository
// ============================================================
// Owns all SQL against `staff_users`. Services call these; no SQL
// leaks into services/controllers.
// ============================================================

import pool from "../db/index.js";

// Columns safe to expose to clients (never the raw refresh_token).
const PUBLIC_COLUMNS = `
    su.id, su.name, su.phone, su.email, su.role_id, su.store_id,
    su.profile_image, su.designation, su.department, su.employee_id, su.notes,
    su.is_active, su.is_archived, su.is_invited,
    su.first_login_at, su.last_login, su.failed_otp_count, su.locked_until,
    su.created_at, su.updated_at
`;

const WITH_ROLE = `
    ${PUBLIC_COLUMNS},
    r.name AS role_name,
    r.permissions_version,
    st.name AS store_name
`;

const BASE_JOINS = `
    FROM staff_users su
    LEFT JOIN roles  r  ON r.id  = su.role_id
    LEFT JOIN stores st ON st.id = su.store_id
`;

/** Fetch a staff member by phone, joined with role name + version. */
export const findByPhone = async (phone) => {
    const { rows } = await pool.query(
        `SELECT ${WITH_ROLE} ${BASE_JOINS} WHERE su.phone = $1`,
        [phone]
    );
    return rows[0] || null;
};

/** Fetch a staff member by id, joined with role name + version. */
export const findById = async (id) => {
    const { rows } = await pool.query(
        `SELECT ${WITH_ROLE} ${BASE_JOINS} WHERE su.id = $1`,
        [id]
    );
    return rows[0] || null;
};

/** Create a staff member. */
export const create = async (data) => {
    const { rows } = await pool.query(
        `INSERT INTO staff_users
            (name, phone, email, role_id, store_id, profile_image,
             designation, department, employee_id, notes, is_active, is_invited)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, TRUE)
         RETURNING id`,
        [
            data.name, data.phone, data.email ?? null, data.role_id ?? null,
            data.store_id ?? null, data.profile_image ?? null,
            data.designation ?? null, data.department ?? null,
            data.employee_id ?? null, data.notes ?? null,
            data.is_active ?? true,
        ]
    );
    return findById(rows[0].id);
};

/** Update editable fields (partial). Returns the fresh joined row. */
export const update = async (id, data) => {
    const fields = [];
    const params = [];
    let i = 1;
    const set = (col, val) => { fields.push(`${col} = $${i++}`); params.push(val); };

    if (data.name        !== undefined) set("name", data.name);
    if (data.email       !== undefined) set("email", data.email);
    if (data.role_id     !== undefined) set("role_id", data.role_id);
    if (data.store_id    !== undefined) set("store_id", data.store_id);
    if (data.profile_image !== undefined) set("profile_image", data.profile_image);
    if (data.designation !== undefined) set("designation", data.designation);
    if (data.department  !== undefined) set("department", data.department);
    if (data.employee_id !== undefined) set("employee_id", data.employee_id);
    if (data.notes       !== undefined) set("notes", data.notes);
    if (data.is_active   !== undefined) set("is_active", data.is_active);

    if (fields.length === 0) return findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);
    await pool.query(
        `UPDATE staff_users SET ${fields.join(", ")} WHERE id = $${i}`,
        params
    );
    return findById(id);
};

/** Toggle active/disabled. */
export const setStatus = async (id, isActive) => {
    await pool.query(
        `UPDATE staff_users SET is_active = $2, updated_at = NOW() WHERE id = $1`,
        [id, isActive]
    );
    return findById(id);
};

/** Toggle archived. */
export const setArchived = async (id, isArchived) => {
    await pool.query(
        `UPDATE staff_users SET is_archived = $2, updated_at = NOW() WHERE id = $1`,
        [id, isArchived]
    );
    return findById(id);
};

/** Permanently delete (super_admin only — enforced in service). */
export const remove = async (id) => {
    const { rows } = await pool.query(
        `DELETE FROM staff_users WHERE id = $1 RETURNING id`,
        [id]
    );
    return rows[0] || null;
};

/** How many staff reference a given role (used to block role deletion). */
export const countByRole = async (roleId) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM staff_users WHERE role_id = $1`,
        [roleId]
    );
    return rows[0].count;
};

/**
 * Paginated, filterable listing.
 *   filters: search, roleId, status(active|disabled|archived|locked|invited), storeId
 */
export const list = async ({
    page = 1, limit = 20, search = null, roleId = null, status = null, storeId = null,
}) => {
    const clauses = [];
    const params = [];
    let i = 1;

    if (search) {
        clauses.push(`(su.name ILIKE $${i} OR su.phone ILIKE $${i} OR su.email ILIKE $${i} OR su.employee_id ILIKE $${i})`);
        params.push(`%${search}%`); i++;
    }
    if (roleId)  { clauses.push(`su.role_id = $${i++}`);  params.push(roleId); }
    if (storeId) { clauses.push(`su.store_id = $${i++}`); params.push(storeId); }

    switch (status) {
        case "archived": clauses.push(`su.is_archived = TRUE`); break;
        case "disabled": clauses.push(`su.is_archived = FALSE AND su.is_active = FALSE`); break;
        case "locked":   clauses.push(`su.is_archived = FALSE AND su.locked_until IS NOT NULL AND su.locked_until > NOW()`); break;
        case "invited":  clauses.push(`su.is_archived = FALSE AND su.is_invited = TRUE`); break;
        case "active":   clauses.push(`su.is_archived = FALSE AND su.is_active = TRUE`); break;
        default: break;
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total ${BASE_JOINS} ${where}`,
        params
    );
    const dataRes = await pool.query(
        `SELECT ${WITH_ROLE} ${BASE_JOINS} ${where}
         ORDER BY su.created_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
        [...params, limit, offset]
    );

    return {
        items: dataRes.rows,
        total: countRes.rows[0].total,
        page, limit,
        totalPages: Math.ceil(countRes.rows[0].total / limit) || 1,
    };
};

/** Mark a successful login: last_login, first_login_at, clear invite + failures. */
export const recordLoginSuccess = async (id) => {
    const { rows } = await pool.query(
        `UPDATE staff_users
         SET last_login       = NOW(),
             first_login_at   = COALESCE(first_login_at, NOW()),
             is_invited       = FALSE,
             failed_otp_count = 0,
             locked_until     = NULL,
             updated_at       = NOW()
         WHERE id = $1
         RETURNING id, first_login_at, last_login`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Increment failed OTP counter. Locks the account for `lockMinutes`
 * when failures reach `threshold`. Returns { failed_otp_count, locked_until }.
 */
export const recordLoginFailure = async (id, threshold, lockMinutes) => {
    const { rows } = await pool.query(
        `UPDATE staff_users
         SET failed_otp_count = failed_otp_count + 1,
             locked_until = CASE
                WHEN failed_otp_count + 1 >= $2
                THEN NOW() + ($3 || ' minutes')::interval
                ELSE locked_until
             END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING failed_otp_count, locked_until`,
        [id, threshold, String(lockMinutes)]
    );
    return rows[0] || null;
};

/** Clear a lock + reset failure counter (admin unlock). */
export const unlock = async (id) => {
    const { rows } = await pool.query(
        `UPDATE staff_users
         SET failed_otp_count = 0, locked_until = NULL, updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [id]
    );
    return rows[0] || null;
};

export default {
    findByPhone,
    findById,
    create,
    update,
    setStatus,
    setArchived,
    remove,
    countByRole,
    list,
    recordLoginSuccess,
    recordLoginFailure,
    unlock,
    PUBLIC_COLUMNS,
};
