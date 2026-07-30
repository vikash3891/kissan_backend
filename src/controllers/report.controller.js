import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { reportService } from "../services/report.service.js";

const getDashboard = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getDashboardSummary(startDate, endDate);
    return res.status(200).json(new ApiResponse(200, data, "Dashboard summary fetched successfully"));
});

const getSales = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy } = req.query;
    const data = await reportService.getSalesAnalytics(startDate, endDate, groupBy);
    return res.status(200).json(new ApiResponse(200, data, "Sales analytics fetched successfully"));
});

const getOrders = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getOrderAnalytics(startDate, endDate);
    return res.status(200).json(new ApiResponse(200, data, "Order analytics fetched successfully"));
});

const getProducts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const data = await reportService.getProductAnalytics(limit ? parseInt(limit) : 10);
    return res.status(200).json(new ApiResponse(200, data, "Product analytics fetched successfully"));
});

const getCategories = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getCategoryAnalytics(startDate, endDate);
    return res.status(200).json(new ApiResponse(200, data, "Category analytics fetched successfully"));
});

const getCustomers = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getCustomerAnalytics(startDate, endDate);
    return res.status(200).json(new ApiResponse(200, data, "Customer analytics fetched successfully"));
});

const getInventory = asyncHandler(async (req, res) => {
    const data = await reportService.getInventoryAnalytics();
    return res.status(200).json(new ApiResponse(200, data, "Inventory analytics fetched successfully"));
});

const getCoupons = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getCouponAnalytics(startDate, endDate);
    return res.status(200).json(new ApiResponse(200, data, "Coupon analytics fetched successfully"));
});

export {
    getDashboard,
    getSales,
    getOrders,
    getProducts,
    getCategories,
    getCustomers,
    getInventory,
    getCoupons
};
