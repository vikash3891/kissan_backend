
import express from "express";

import cors from "cors";

import authRoutes
from "./routes/auth.routes.js";
import productRoutes
from "./routes/product.routes.js";
import categoryRoutes
from "./routes/category.routes.js";

import bannerRoutes from "./routes/banner.routes.js";
import homeRoutes from "./routes/home.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes
from "./routes/order.routes.js";
import addressRoutes
from "./routes/address.routes.js";
import wishlistRoutes
from "./routes/wishlist.routes.js";
import couponRoutes 
from "./routes/coupon.routes.js";
import reviewRoutes
from "./routes/reviews.routes.js";

// ─── Admin-specific routes ──────────────────────────────────
import dashboardRoutes
from "./routes/dashboard.routes.js";
import userRoutes
from "./routes/user.routes.js";
import reportRoutes
from "./routes/report.routes.js";

// ─── Staff Management + RBAC routes ─────────────────────────
import staffAuthRoutes
from "./routes/staffAuth.routes.js";
import staffRoutes
from "./routes/staff.routes.js";
import roleRoutes
from "./routes/role.routes.js";
import rbacAdminRoutes
from "./routes/rbacAdmin.routes.js";
import staffDashboardRoutes
from "./routes/staffDashboard.routes.js";
import storeRoutes from "./routes/store.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

// ─── API Routes ─────────────────────────────────────────────

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/banners",
    bannerRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
)
app.use(
    "/api/home",
    homeRoutes

)
app.use(
    "/api/cart",
    cartRoutes
);
app.use(
    "/api/address",
    addressRoutes
);
app.use(
    "/api/orders",
    orderRoutes
)
app.use(
    "/api/wishlist",
    wishlistRoutes
);

app.use(
    "/api/reviews",
    reviewRoutes
);
app.use(
    "/api/coupons",
    couponRoutes
)

// ─── Admin Routes ───────────────────────────────────────────

// Staff phone-OTP authentication (no passwords)
app.use(
    "/api/staff/auth",
    staffAuthRoutes
);

// Staff management, roles, permissions, stores, activity logs
app.use(
    "/api/admin/staff",
    staffRoutes
);

app.use(
    "/api/admin/roles",
    roleRoutes
);

app.use(
    "/api/admin",
    rbacAdminRoutes
);

app.use(
    "/api/admin/staff-dashboard",
    staffDashboardRoutes
);

app.use(
    "/api/admin/dashboard",
    dashboardRoutes
);

app.use(
    "/api/admin/users",
    userRoutes
);

app.use(
    "/api/admin/reports",
    reportRoutes
);

app.use(
    "/api/admin/store",
    storeRoutes
);

// ─── Global Error Handler ───────────────────────────────────

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        statusCode,
        message,
        success: false
    });
});

export default app;
