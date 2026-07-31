import pool from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../utils/roles.js";

const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClauses = [];

    if (search) {
        whereClauses.push(`u.phone LIKE $${queryParams.length + 1}`);
        queryParams.push(`%${search}%`);
    }

    if (role) {
        whereClauses.push(`u.role = $${queryParams.length + 1}`);
        queryParams.push(role);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `
        SELECT COUNT(*) FROM (
            SELECT id, phone, role FROM users
            UNION ALL
            SELECT s.id, s.phone, r.slug AS role FROM staff_users s LEFT JOIN roles r ON s.role_id = r.id
        ) u
        ${whereStr}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const usersQuery = `
        SELECT 
            u.id, u.phone, u.role, u.created_at,
            COUNT(DISTINCT o.id) AS order_count,
            COALESCE(SUM(o.final_amount), 0) AS total_spent
        FROM (
            SELECT id, phone, role, created_at FROM users
            UNION ALL
            SELECT s.id, s.phone, r.slug AS role, s.created_at FROM staff_users s LEFT JOIN roles r ON s.role_id = r.id
        ) u
        LEFT JOIN orders o ON u.id = o.user_id
        ${whereStr}
        GROUP BY u.id, u.phone, u.role, u.created_at
        ORDER BY u.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const usersParams = [...queryParams, limit, offset];
    const usersResult = await pool.query(usersQuery, usersParams);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
        new ApiResponse(200, {
            users: usersResult.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages }
        }, "Users retrieved successfully")
    );
});

const getSingleUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userQuery = `SELECT id, phone, role, created_at FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rowCount === 0) {
        throw new ApiError(404, "User not found");
    }

    const user = userResult.rows[0];

    const ordersQuery = `
        SELECT id, order_status, total_amount, final_amount, created_at 
        FROM orders 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
    `;
    const ordersResult = await pool.query(ordersQuery, [id]);

    const addressesQuery = `
        SELECT id, full_name, phone, house_no, area, landmark, city, state, pincode, address_type
        FROM addresses
        WHERE user_id = $1
    `;
    const addressesResult = await pool.query(addressesQuery, [id]);

    user.recent_orders = ordersResult.rows;
    user.addresses = addressesResult.rows;

    res.status(200).json(new ApiResponse(200, user, "User details retrieved successfully"));
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const requestorRole = req.user.role;

    if (!Object.values(ROLES).includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
        if (requestorRole !== ROLES.SUPER_ADMIN) {
            throw new ApiError(403, "Only super_admin can assign admin or super_admin roles");
        }
    }

    if (role === ROLES.CUSTOMER || role === ROLES.MANAGER) {
        if (requestorRole !== ROLES.ADMIN && requestorRole !== ROLES.SUPER_ADMIN) {
            throw new ApiError(403, "Only admin or super_admin can assign customer or manager roles");
        }
    }

    const updateQuery = `
        UPDATE users 
        SET role = $1 
        WHERE id = $2 
        RETURNING id, phone, role, created_at
    `;
    const updateResult = await pool.query(updateQuery, [role, id]);

    if (updateResult.rowCount === 0) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, updateResult.rows[0], "User role updated successfully"));
});

const getUserStats = asyncHandler(async (req, res) => {
    const totalResult = await pool.query(`SELECT COUNT(*) FROM users`);
    const totalUsers = parseInt(totalResult.rows[0].count);

    const newThisMonthQuery = `
        SELECT COUNT(*) 
        FROM users 
        WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
    `;
    const newThisMonthResult = await pool.query(newThisMonthQuery);
    const newUsersThisMonth = parseInt(newThisMonthResult.rows[0].count);

    const newLastMonthQuery = `
        SELECT COUNT(*) 
        FROM users 
        WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    `;
    const newLastMonthResult = await pool.query(newLastMonthQuery);
    const newUsersLastMonth = parseInt(newLastMonthResult.rows[0].count);

    const rolesQuery = `
        SELECT role, COUNT(*) 
        FROM users 
        GROUP BY role
    `;
    const rolesResult = await pool.query(rolesQuery);
    
    const roleBreakdown = {
        customer: 0,
        manager: 0,
        admin: 0,
        super_admin: 0
    };

    rolesResult.rows.forEach(row => {
        if (roleBreakdown.hasOwnProperty(row.role)) {
            roleBreakdown[row.role] = parseInt(row.count);
        }
    });

    res.status(200).json(new ApiResponse(200, {
        totalUsers,
        newUsersThisMonth,
        newUsersLastMonth,
        roleBreakdown
    }, "User stats retrieved successfully"));
});

export { getAllUsers, getSingleUser, updateUserRole, getUserStats };
