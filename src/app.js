
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
const app = express();

app.use(cors());

app.use(express.json());

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
export default app;