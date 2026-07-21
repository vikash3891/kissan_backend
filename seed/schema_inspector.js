import pool from "../src/db/index.js";

/**
 * Dynamically checks if a table exists in the current database schema.
 */
export async function tableExists(tableName) {
    const query = `
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
        );
    `;
    const res = await pool.query(query, [tableName]);
    return res.rows[0].exists;
}

/**
 * Retrieves the exact column names for a given table.
 */
export async function getTableColumns(tableName) {
    const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1;
    `;
    const res = await pool.query(query, [tableName]);
    return res.rows.map(row => row.column_name);
}

/**
 * Checks if a specific column exists in a table.
 */
export async function columnExists(tableName, columnName) {
    const columns = await getTableColumns(tableName);
    return columns.includes(columnName);
}
