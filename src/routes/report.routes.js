import { Router } from "express";
import { 
    getDashboard, 
    getSales, 
    getOrders, 
    getProducts, 
    getCategories, 
    getCustomers, 
    getInventory, 
    getCoupons 
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../utils/roles.js";

const router = Router();

// Secure all routes
router.use(verifyJWT);
router.use(verifyPermission(PERMISSIONS.REPORTS_VIEW));

router.route("/dashboard").get(getDashboard);
router.route("/sales").get(getSales);
router.route("/orders").get(getOrders);
router.route("/products").get(getProducts);
router.route("/categories").get(getCategories);
router.route("/customers").get(getCustomers);
router.route("/inventory").get(getInventory);
router.route("/coupons").get(getCoupons);

export default router;
