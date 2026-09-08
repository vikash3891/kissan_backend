export const seedCoupons = [
    { code: "WELCOME100", description: "Get ₹100 off on your first order", discount_type: "fixed", discount_value: 100, minimum_order_amount: 500, maximum_discount: 100, usage_limit: 1000, is_active: true },
    { code: "SAVE50", description: "Flat ₹50 off on all groceries", discount_type: "fixed", discount_value: 50, minimum_order_amount: 300, maximum_discount: 50, usage_limit: 500, is_active: true },
    { code: "FARM10", description: "10% off on Farm Fresh products", discount_type: "percentage", discount_value: 10, minimum_order_amount: 400, maximum_discount: 150, usage_limit: 200, is_active: true },
    { code: "ORGANIC20", description: "20% off on all organic items", discount_type: "percentage", discount_value: 20, minimum_order_amount: 600, maximum_discount: 250, usage_limit: 100, is_active: true },
    { code: "FREEDELIVERY", description: "Free delivery on orders above ₹1000", discount_type: "fixed", discount_value: 50, minimum_order_amount: 1000, maximum_discount: 50, usage_limit: 10000, is_active: true }
];
