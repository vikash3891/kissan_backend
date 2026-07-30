import jwt from "jsonwebtoken";


// ACCESS TOKEN (customer / legacy)
const generateAccessToken = (user) => {

    return jwt.sign(

{
   id: user.id,
   phone: user.phone,
   role: user.role
},

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn:
                process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};



// REFRESH TOKEN (customer / legacy)
const generateRefreshToken = (user) => {

    return jwt.sign(

        {
            id: user.id
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn:
                process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};


// ─── STAFF ACCESS TOKEN ─────────────────────────────────────
// Signed with the SAME ACCESS_TOKEN_SECRET so `verifyJWT` needs no
// change. Carries DB-driven permissions[] + versioning so the
// dual-mode `verifyPermission` middleware authorizes without a
// per-request DB hit.
//
//   staff  = { id, phone, role (role name string), roleId,
//              storeId, permissions[], permissionsVersion }
const generateStaffAccessToken = (staff) => {

    return jwt.sign(
        {
            id:                 staff.id,
            phone:              staff.phone,
            role:               staff.role,
            roleId:             staff.roleId,
            storeId:            staff.storeId ?? null,
            permissions:        staff.permissions ?? [],
            permissionsVersion: staff.permissionsVersion ?? 1,
            type:               'staff'
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn:
                process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};


// ─── STAFF REFRESH TOKEN ────────────────────────────────────
// Minimal claims; the refresh flow re-reads role permissions from
// the DB and re-mints a fresh access token (so perms never go stale
// beyond one access-token TTL).
const generateStaffRefreshToken = (staff) => {

    return jwt.sign(
        {
            id:   staff.id,
            type: 'staff'
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn:
                process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};


export {
    generateAccessToken,
    generateRefreshToken,
    generateStaffAccessToken,
    generateStaffRefreshToken
};
