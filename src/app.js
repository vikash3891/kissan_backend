
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
export default app;