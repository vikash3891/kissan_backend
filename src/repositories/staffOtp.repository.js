// ============================================================
// Kisaan Kart — Staff OTP Repository
// ============================================================
// Owns all SQL against `staff_otps` (staff phone-OTP challenges).
// OTPs are stored hashed (sha256) with expiry + per-OTP attempt count.
// ============================================================

import pool from "../db/index.js";

/** Insert a new OTP challenge. */
export const create = async ({ phone, otpHash, expiresAt }) => {
    const { rows } = await pool.query(
        `INSERT INTO staff_otps (phone, otp_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, phone, expires_at, created_at`,
        [phone, otpHash, expiresAt]
    );
    return rows[0];
};

/** Most recent, unexpired OTP row for a phone (regardless of hash match). */
export const findLatestActive = async (phone) => {
    const { rows } = await pool.query(
        `SELECT * FROM staff_otps
         WHERE phone = $1 AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [phone]
    );
    return rows[0] || null;
};

/** Count OTP sends for a phone within the trailing `intervalMinutes` (rate limit). */
export const countRecentSends = async (phone, intervalMinutes) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM staff_otps
         WHERE phone = $1
           AND created_at > NOW() - ($2 || ' minutes')::interval`,
        [phone, String(intervalMinutes)]
    );
    return rows[0].count;
};

/** Increment the per-OTP verify attempt counter. */
export const incrementAttempts = async (id) => {
    const { rows } = await pool.query(
        `UPDATE staff_otps
         SET attempts = attempts + 1
         WHERE id = $1
         RETURNING attempts`,
        [id]
    );
    return rows[0]?.attempts ?? null;
};

/** Expire every active OTP for a phone (called on successful verify). */
export const expireAllForPhone = async (phone) => {
    await pool.query(
        `UPDATE staff_otps SET expires_at = NOW()
         WHERE phone = $1 AND expires_at > NOW()`,
        [phone]
    );
};

export default {
    create,
    findLatestActive,
    countRecentSends,
    incrementAttempts,
    expireAllForPhone,
};
