// ============================================================
// Kisaan Kart — Activity Log Service
// ============================================================
// Thin wrapper over the activity-log repository that:
//   • never lets an audit write break the triggering request
//     (best-effort; logs failures instead of throwing)
//   • extracts request context (ip / device / browser) uniformly
// ============================================================

import activityLogRepo from "../repositories/activityLog.repository.js";

/** Pull ip / user-agent context from an Express request. */
export const contextFromReq = (req) => {
    if (!req) return {};
    const ua = req.headers?.["user-agent"] || null;
    const ip =
        req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
    return { ipAddress: ip, device: ua, browser: ua };
};

/**
 * Record an activity-log entry (best-effort — swallows errors so the
 * audit trail can never break the operation it is auditing).
 */
export const record = async (entry) => {
    try {
        return await activityLogRepo.insert(entry);
    } catch (err) {
        console.error("[activityLog] failed to record:", err.message);
        return null;
    }
};

/** Convenience: record using an Express request for context. */
export const recordFromReq = async (req, entry) => {
    return record({ ...contextFromReq(req), ...entry });
};

export const list = (opts) => activityLogRepo.list(opts);

export default { record, recordFromReq, contextFromReq, list };
