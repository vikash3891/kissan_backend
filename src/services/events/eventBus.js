// ============================================================
// Kisaan Kart — Event Bus (notification hooks, enh #13)
// ============================================================
// A tiny synchronous emitter wrapping Node's EventEmitter. Services
// emit domain events (staff.created, auth.login, role.permissions_changed,
// session.revoked, ...) and sinks subscribe. The default sink logs;
// SMS / email / push sinks can be attached later with zero call-site
// changes.
//
//   import { eventBus, EVENTS } from "../events/eventBus.js";
//   eventBus.emitEvent(EVENTS.AUTH_LOGIN, { staffId, phone });
// ============================================================

import { EventEmitter } from "events";

export const EVENTS = Object.freeze({
    STAFF_CREATED:            "staff.created",
    STAFF_UPDATED:            "staff.updated",
    STAFF_STATUS_CHANGED:     "staff.status_changed",
    STAFF_ROLE_CHANGED:       "staff.role_changed",
    STAFF_ARCHIVED:           "staff.archived",
    STAFF_DELETED:            "staff.deleted",
    STAFF_UNLOCKED:           "staff.unlocked",
    ROLE_PERMISSIONS_CHANGED: "role.permissions_changed",
    SESSION_REVOKED:          "session.revoked",
    AUTH_LOGIN:               "auth.login",
    AUTH_LOGIN_FAILED:        "auth.login_failed",
    AUTH_LOGOUT:              "auth.logout",
    OTP_SENT:                 "otp.sent",
    ACCOUNT_LOCKED:           "account.locked",
});

class KisaanEventBus extends EventEmitter {
    /**
     * Emit a domain event. Never throws to callers — a failing sink
     * must not break the request that triggered it.
     */
    emitEvent(event, payload = {}) {
        try {
            this.emit(event, { event, at: new Date().toISOString(), ...payload });
        } catch (err) {
            console.error(`[eventBus] sink error for "${event}":`, err);
        }
    }
}

export const eventBus = new KisaanEventBus();
// Allow many sinks without the default 10-listener warning.
eventBus.setMaxListeners(50);

// ─── Default sink: structured console log ───────────────────
const DEFAULT_LOGGED_EVENTS = Object.values(EVENTS);
for (const evt of DEFAULT_LOGGED_EVENTS) {
    eventBus.on(evt, (payload) => {
        console.log(`[event] ${evt}`, JSON.stringify(payload));
    });
}

export default eventBus;
