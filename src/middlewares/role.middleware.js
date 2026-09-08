// ============================================================
// Kisaan Kart — Role & Permission Middleware
// ============================================================
// Flexible RBAC checks. Works for BOTH:
//   • DB-driven staff tokens carrying a `permissions[]` array
//   • Legacy customer/admin tokens carrying only a `role` string
//
// Usage:
//   verifyRole('admin', 'manager')         → allow those roles
//   verifyPermission('products.create')    → permission check (dual-mode)
//   requireSuperAdmin                       → super_admin only
// ============================================================

import { ApiError }               from "../utils/ApiError.js";
import { ROLE_PERMISSIONS, ROLES } from "../utils/roles.js";

// ─── verifyRole ─────────────────────────────────────────────
// Checks if req.user.role is one of the allowed roles.
export const verifyRole = (...allowedRoles) => {
    return (req, _res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            throw new ApiError(401, "Authentication required");
        }

        if (!allowedRoles.includes(userRole)) {
            throw new ApiError(
                403,
                `Access denied. Required role: ${allowedRoles.join(' or ')}`
            );
        }

        next();
    };
};

// ─── requireSuperAdmin ──────────────────────────────────────
export const requireSuperAdmin = (req, _res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    if (req.user.role !== ROLES.SUPER_ADMIN) {
        throw new ApiError(403, "Access denied. Super admin only.");
    }
    next();
};

// ─── Internal: resolve the effective permission set ─────────
// Resolution order (plan decision D2):
//   1. super_admin                → allow-all (wildcard).
//   2. explicit permissions[]     → DB-driven staff token; use it.
//   3. legacy role string         → static ROLE_PERMISSIONS matrix.
const resolvePermissions = (user) => {
    if (!user) return { allowAll: false, perms: [] };

    if (user.role === ROLES.SUPER_ADMIN) {
        return { allowAll: true, perms: [] };
    }

    if (Array.isArray(user.permissions)) {
        return { allowAll: false, perms: user.permissions };
    }

    // Legacy fallback (role-based static matrix)
    return { allowAll: false, perms: ROLE_PERMISSIONS[user.role] || [] };
};

// ─── verifyPermission ───────────────────────────────────────
// Grants access if the user has ANY of the required permissions.
export const verifyPermission = (...requiredPermissions) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        const { allowAll, perms } = resolvePermissions(req.user);

        if (allowAll) return next();

        const hasAccess = requiredPermissions.some(
            perm => perms.includes(perm)
        );

        if (!hasAccess) {
            throw new ApiError(
                403,
                `Access denied. Required permission: ${requiredPermissions.join(' or ')}`
            );
        }

        next();
    };
};

// ─── requireFreshPermissions (optional strict mode — enh #7) ─
// Off by default. When mounted, compares the JWT's permissionsVersion
// against the role's current permissions_version and forces a refresh
// (409) if stale. A version-lookup fn is injected so middleware stays
// decoupled from the repository layer.
//
//   import { getRoleVersion } from "../repositories/role.repository.js";
//   router.use(requireFreshPermissions(getRoleVersion));
export const requireFreshPermissions = (getRoleVersion) => {
    return async (req, _res, next) => {
        try {
            const user = req.user;
            // Only staff tokens carry a role version; legacy tokens skip.
            if (!user || user.type !== 'staff' || !user.roleId) return next();

            const currentVersion = await getRoleVersion(user.roleId);
            if (
                currentVersion != null &&
                user.permissionsVersion !== currentVersion
            ) {
                throw new ApiError(
                    409,
                    "PERMISSIONS_STALE: your permissions changed; please refresh your session."
                );
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};
