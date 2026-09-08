import pool from "../db/index.js";
import { reportQueries } from "../utils/reportQueries.js";

class ReportService {
    async getDashboardSummary(startDate, endDate) {
        const { query: summaryQ, params: summaryP } = reportQueries.getDashboardSummary(startDate, endDate);
        const topProductsQ = reportQueries.getTopSellingProducts(5);
        const recentOrdersQ = reportQueries.getRecentOrders(5);

        const [summaryResult, topProductsResult, recentOrdersResult] = await Promise.all([
            pool.query(summaryQ, summaryP),
            pool.query(topProductsQ),
            pool.query(recentOrdersQ)
        ]);

        const summary = summaryResult.rows[0] || {};
        return {
            todayRevenue: parseFloat(summary.revenue || 0),
            todayOrders: parseInt(summary.total_orders || 0),
            todayCustomers: parseInt(summary.total_customers || 0),
            monthlyRevenue: 0, // Should calculate from separate query if needed, but keeping interface intact
            totalProducts: parseInt(summary.total_products || 0),
            totalCategories: parseInt(summary.total_categories || 0),
            lowStock: parseInt(summary.low_stock || 0),
            outOfStock: parseInt(summary.out_of_stock || 0),
            pendingOrders: parseInt(summary.pending_orders || 0),
            cancelledOrders: parseInt(summary.cancelled_orders || 0),
            deliveredOrders: parseInt(summary.delivered_orders || 0),
            topSellingProducts: topProductsResult.rows,
            recentOrders: recentOrdersResult.rows
        };
    }

    async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
        const { query, params } = reportQueries.getSalesAnalytics(startDate, endDate, groupBy);
        const result = await pool.query(query, params);
        return result.rows.map(row => ({
            period: row.period,
            totalOrders: parseInt(row.total_orders || 0),
            revenue: parseFloat(row.revenue || 0),
            totalDiscount: parseFloat(row.total_discount || 0),
            grossRevenue: parseFloat(row.gross_revenue || 0)
        }));
    }

    async getOrderAnalytics(startDate, endDate) {
        const { query, params } = reportQueries.getOrderAnalytics(startDate, endDate);
        const result = await pool.query(query, params);
        return result.rows;
    }

    async getProductAnalytics(limit = 10) {
        const topQ = reportQueries.getTopSellingProducts(limit);
        const result = await pool.query(topQ);
        return result.rows;
    }

    async getCategoryAnalytics(startDate, endDate) {
        const { query, params } = reportQueries.getCategoryAnalytics(startDate, endDate);
        const result = await pool.query(query, params);
        return result.rows;
    }

    async getCustomerAnalytics(startDate, endDate) {
        const { query: statsQ, params: statsP } = reportQueries.getCustomerAnalytics(startDate, endDate);
        const topQ = reportQueries.getTopCustomers(20);

        const [statsResult, topResult] = await Promise.all([
            pool.query(statsQ, statsP),
            pool.query(topQ)
        ]);

        return {
            stats: statsResult.rows[0],
            topCustomers: topResult.rows
        };
    }

    async getInventoryAnalytics() {
        const { query, params } = reportQueries.getInventoryAnalytics();
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    async getCouponAnalytics(startDate, endDate) {
        const { query, params } = reportQueries.getCouponAnalytics(startDate, endDate);
        const result = await pool.query(query, params);
        return result.rows;
    }
}

export const reportService = new ReportService();
