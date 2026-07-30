# Staff Management + RBAC + Phone-OTP Auth

Enterprise staff module for Kisaan Kart. An admin creates staff, assigns a
**role** (which carries a **permission set**), and staff sign in with
**Phone + OTP only — no passwords, ever**.

It runs alongside the existing customer auth (`/api/auth/*`) and legacy admin
routes with **zero changes to their behaviour**. Both customer and staff JWTs are
signed with the same `ACCESS_TOKEN_SECRET`, so `verifyJWT` is unchanged; the
`verifyPermission` middleware is now **dual-mode** (DB-driven `permissions[]` for
staff tokens, static fallback matrix for legacy tokens).

---

## Setup

```bash
npm run migrate:rbac   # idempotent schema (records itself in schema_migrations)
npm run seed:rbac      # permissions, 12 system roles, default store, migrate existing admin
```

Both are safe to re-run. The seed migrates every `users` row with role
`admin`/`super_admin` into `staff_users` as **Super Admin** (`ON CONFLICT (phone) DO NOTHING`).

### OTP delivery

`src/services/otp/otpProvider.js` abstracts delivery:

- **ConsoleOtpProvider** (dev) — logs the OTP; the API also echoes it in responses
  when `NODE_ENV !== 'production'`.
- **SmsOtpProvider** (prod) — stub that throws until a real gateway is wired in.
  Selected automatically when `NODE_ENV=production`, or force with `OTP_PROVIDER=sms|console`.

**The OTP is never returned by the API in production.**

---

## Data model

| Table | Purpose |
|-------|---------|
| `schema_migrations` | applied-migration history |
| `stores` | multi-store readiness; staff/roles carry a nullable `store_id` |
| `roles` | `is_system`, `is_active`, `permissions_version` |
| `permissions` | canonical `module.action` catalog (42 rows) |
| `role_permissions` | role ↔ permission join |
| `staff_users` | staff identity, profile, status, lockout counters |
| `staff_otps` | hashed OTP challenges (expiry + per-OTP attempts) |
| `staff_sessions` | one row per login; hashed refresh token, device info, `needs_refresh` |
| `activity_logs` | before/after audit trail with ip/device/browser/location |

Permission keys are `module.action` lowercase, e.g. `products.create`,
`orders.refund`, `staff.permissions`, `sessions.revoke`.

---

## Security rules

**OTP**
- 6-digit, 5-minute expiry, hashed (sha256) at rest.
- Max **3 verify attempts** per OTP.
- Max **5 sends** per phone per hour (`429` otherwise).

**Account lockout**
- **10 failed verifications** → account locked for **30 minutes** (`423`).
- Super Admin / Admin can unlock (`PATCH /api/admin/staff/:id/unlock`).

**Login denials**
- Unknown phone → `404`; disabled → `403`; archived → `403`; locked → `423`.

**Privilege guards**
- Only **Super Admin** may create/assign **Admin** or **Super Admin** roles, or
  modify such accounts.
- Only **Super Admin** may **permanently delete** staff (others archive/disable).
- System roles cannot be renamed or deleted; a role in use cannot be deleted.

**Permission freshness**
- Access tokens are short-lived and carry `permissions[]` + `permissionsVersion`.
- Editing a role's permissions **bumps `permissions_version`** and flags all
  affected sessions `needs_refresh=true`.
- `refresh-token` **re-reads permissions from the DB** on every call, so a stale
  window never exceeds one access-token TTL. `GET /me` returns fresh permissions
  for the UI without a re-login. Changing a staff member's role revokes their
  active sessions (forces re-login with the new permission set).
- Optional strict guard `requireFreshPermissions(getRoleVersion)` (off by default)
  can return `409 PERMISSIONS_STALE` to force an immediate refresh.

---

## API

All responses use the shared envelope `{ statusCode, data, message, success }`.

### Staff auth — `/api/staff/auth` (phone + OTP)
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/send-otp` | `{ phone }` | `+ otp` in dev |
| POST | `/resend-otp` | `{ phone }` | `+ otp` in dev |
| POST | `/verify-otp` | `{ phone, otp }` | → `{ token, refreshToken, user, role, permissions }` |
| POST | `/refresh-token` | `{ refreshToken }` | → `{ token, permissions }` |
| GET | `/me` | _(auth)_ | → `{ user, role, permissions, permissionsVersion }` |
| POST | `/logout` | `{ refreshToken }` _(auth)_ | revokes the session |

### Staff admin — `/api/admin/staff` (auth + permission)
| Method | Path | Guard |
|--------|------|-------|
| GET | `/` `?page&limit&search&role&status&store` | `staff.view` |
| POST | `/` | `staff.create` |
| GET | `/:id` | `staff.view` |
| PUT | `/:id` | `staff.update` |
| PATCH | `/:id/status` `{ is_active }` | `staff.update` |
| PATCH | `/:id/archive` `{ is_archived }` | `staff.update` |
| PATCH | `/:id/unlock` | `staff.update` |
| DELETE | `/:id` | **super_admin** + `staff.delete` |
| GET | `/:id/sessions` | `sessions.view` |
| DELETE | `/:id/sessions/:sid` | `sessions.revoke` |

### Roles — `/api/admin/roles`
| Method | Path | Guard |
|--------|------|-------|
| GET | `/` , GET `/:id` | `roles.view` |
| POST | `/` `{ name, description, permission_ids[] }` | `roles.create` |
| PUT | `/:id` | `roles.update` |
| PATCH | `/:id/permissions` `{ permission_ids[] }` | `roles.update` / `staff.permissions` |
| DELETE | `/:id` | `roles.delete` |

### Supporting — `/api/admin`
| Method | Path | Guard |
|--------|------|-------|
| GET | `/permissions` (module-grouped) | `roles.view` / `staff.permissions` / `staff.view` |
| GET | `/stores` | `stores.view` / `staff.view` |
| POST | `/stores` | `stores.manage` |
| GET | `/activity-logs` `?page&limit&search&staff_id&action&from&to` | `staff.view` / `reports.view` |

---

## Architecture

```
routes → controllers → services → repositories → pg pool
                          │
                          ├── services/otp/otpProvider.js   (delivery abstraction)
                          ├── services/events/eventBus.js   (notification hooks)
                          └── services/activityLog.service.js (audit trail)
```

- **Repositories** (`src/repositories/*`) own all SQL.
- **Services** own business rules, emit events, and write audit entries.
- **Controllers** are thin and reuse `ApiResponse` / `ApiError` / `asyncHandler`.
- **Event bus** (`eventBus.emitEvent`) emits `staff.*`, `role.permissions_changed`,
  `session.revoked`, `auth.login[_failed]`, `otp.sent`, `account.locked`. Default
  sink logs; SMS/email/push sinks attach later with no call-site changes.

### JWT payloads
- Customer/legacy: `{ id, phone, role }`.
- Staff: `{ id, phone, role (slug), roleId, storeId, permissions[], permissionsVersion, type:'staff' }`.

Role slugs normalize DB role names (`"Super Admin"` → `super_admin`) so the
middleware's `super_admin` allow-all and `requireSuperAdmin` work against dynamic
role names.

---

## Rollback

New code is additive. Files touched for compatibility: `utils/roles.js` (values),
`middlewares/role.middleware.js` (backward-compatible dual mode), `utils/token.js`
(new fns), `app.js` (new mounts). To drop the schema:

```sql
DROP TABLE IF EXISTS activity_logs, staff_sessions, staff_otps, staff_users,
  role_permissions, permissions, roles, stores, schema_migrations CASCADE;
```

No existing table is altered destructively.
