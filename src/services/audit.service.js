import pool from "../db/index.js";

class AuditService {
    static async logStatusChange({ entityType, entityId, action, oldState, newState, adminId, reason }) {
        try {
            await pool.query(
                `
                INSERT INTO audit_logs
                (entity_type, entity_id, action, old_state, new_state, admin_id, reason)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                [
                    entityType,
                    entityId,
                    action,
                    JSON.stringify(oldState || {}),
                    JSON.stringify(newState || {}),
                    adminId,
                    reason || 'No reason provided'
                ]
            );
        } catch (error) {
            console.error("Failed to insert audit log:", error);
            // Non-blocking
        }
    }
}

export default AuditService;
