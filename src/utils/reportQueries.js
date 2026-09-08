const getDateFilter = (startDate, endDate, dateColumn = 'created_at') => {
    let filter = '';
    const params = [];
    if (startDate && endDate) {
        filter = ` AND DATE(${dateColumn}) >= $1 AND DATE(${dateColumn}) <= $2 `;
        params.push(startDate, endDate);
    }
    return { filter, params };
};

export const reportQueries = {
    // -------------------------
    // DASHBOARD SUMMARY
    // -------------------------
    getDashboardSummary: (startDate, endDate) => {
        const { filter, params } = getDateFilter(startDate, endDate, 'created_at');
        
        const query = `
            SELECT
                (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE order_status != 'cancelled' ${filter}) as revenue,
                (SELECT COUNT(*) FROM orders WHERE 1=1 ${filter}) as total_orders,
                (SELECT COUNT(*) FROM users WHERE role = 'customer' OR role IS NULL) as total_customers,
                (SELECT COUNT(*) FROM products) as total_products,
                (SELECT COUNT(*) FROM categories) as total_categories,
                (SELECT COUNT(*) FROM products WHERE stock > 0 AND stock <= 10) as low_stock,
                (SELECT COUNT(*) FROM products WHERE stock = 0) as out_of_stock,
                (SELECT COUNT(*) FROM orders WHERE order_status = 'pending' ${filter}) as pending_orders,
                (SELECT COUNT(*) FROM orders WHERE order_status = 'cancelled' ${filter}) as cancelled_orders,
                (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered' ${filter}) as delivered_orders
        `;
        return { query, params };
    },

    getRecentOrders: (limit = 5) => {
        return `
            SELECT o.id, o.final_amount as total, o.order_status as status, o.created_at, u.phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT ${limit}
        `;
    },

    getTopSellingProducts: (limit = 5) => {
        return `
            SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as order_count, SUM(oi.quantity * oi.price) as revenue
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.order_status != 'cancelled'
            GROUP BY p.id, p.name, p.image_url
            ORDER BY order_count DESC
            LIMIT ${limit}
        `;
    },

    // -------------------------
    // SALES REPORT
    // -------------------------
    getSalesAnalytics: (startDate, endDate, groupBy = 'day') => {
        const { filter, params } = getDateFilter(startDate, endDate, 'created_at');
        
        let dateTrunc = 'day';
        if (groupBy === 'week') dateTrunc = 'week';
        if (groupBy === 'month') dateTrunc = 'month';
        if (groupBy === 'year') dateTrunc = 'year';

        const query = `
            SELECT 
                DATE_TRUNC('${dateTrunc}', created_at) as period,
                COUNT(id) as total_orders,
                COALESCE(SUM(final_amount), 0) as revenue,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(total_amount), 0) as gross_revenue
            FROM orders
            WHERE order_status != 'cancelled' ${filter}
            GROUP BY period
            ORDER BY period ASC
        `;
        return { query, params };
    },

    // -------------------------
    // ORDERS REPORT
    // -------------------------
    getOrderAnalytics: (startDate, endDate) => {
        const { filter, params } = getDateFilter(startDate, endDate, 'created_at');
        const query = `
            SELECT order_status, COUNT(*) as count 
            FROM orders 
            WHERE 1=1 ${filter}
            GROUP BY order_status
        `;
        return { query, params };
    },

    // -------------------------
    // CATEGORY REPORT
    // -------------------------
    getCategoryAnalytics: (startDate, endDate) => {
        const { filter, params } = getDateFilter(startDate, endDate, 'o.created_at');
        const query = `
            SELECT 
                c.id, c.name, 
                SUM(oi.quantity * oi.price) as revenue,
                SUM(oi.quantity) as items_sold,
                COUNT(DISTINCT o.id) as order_count
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN categories c ON c.id = p.category_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.order_status != 'cancelled' ${filter}
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
        `;
        return { query, params };
    },

    // -------------------------
    // INVENTORY REPORT
    // -------------------------
    getInventoryAnalytics: () => {
        const query = `
            SELECT
                COUNT(*) as total_items,
                SUM(stock) as total_stock_quantity,
                SUM(stock * price) as estimated_stock_value,
                COUNT(CASE WHEN stock > 0 AND stock <= 10 THEN 1 END) as low_stock_items,
                COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_items
            FROM products
        `;
        return { query, params: [] };
    },

    // -------------------------
    // CUSTOMER REPORT
    // -------------------------
    getCustomerAnalytics: (startDate, endDate) => {
        const { filter, params } = getDateFilter(startDate, endDate, 'created_at');
        const query = `
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'customer' OR role IS NULL) as total_customers,
                (SELECT COUNT(*) FROM users WHERE (role = 'customer' OR role IS NULL) ${filter}) as new_customers
        `;
        return { query, params };
    },

    getTopCustomers: (limit = 20) => {
        return `
            SELECT 
                u.id, u.phone,
                (SELECT full_name FROM addresses a WHERE a.user_id = u.id LIMIT 1) as name,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.final_amount), 0) as total_spent
            FROM users u
            JOIN orders o ON u.id = o.user_id
            WHERE o.order_status != 'cancelled'
            GROUP BY u.id, u.phone
            ORDER BY total_spent DESC
            LIMIT ${limit}
        `;
    },

    // -------------------------
    // COUPON REPORT
    // -------------------------
    getCouponAnalytics: (startDate, endDate) => {
        const { filter, params } = getDateFilter(startDate, endDate, 'o.created_at');
        const query = `
            SELECT 
                c.code, 
                c.discount_type,
                c.discount_value,
                COUNT(o.id) as times_used,
                COALESCE(SUM(o.discount_amount), 0) as total_discount_given
            FROM coupons c
            LEFT JOIN orders o ON o.coupon_code = c.code AND o.order_status != 'cancelled' ${filter}
            GROUP BY c.id, c.code, c.discount_type, c.discount_value
            ORDER BY times_used DESC
        `;
        return { query, params };
    }
};
