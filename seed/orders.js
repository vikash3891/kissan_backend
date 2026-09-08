export const generateOrders = (users, addresses, products) => {
    const orders = [];
    const statuses = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
    const paymentMethods = ["COD", "UPI", "Card"];

    const pastDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * days));
        return d.toISOString();
    };

    for (const user of users) {
        // Find an address for this user
        const userAddresses = addresses.filter(a => a.user_id === user.id);
        if (userAddresses.length === 0) continue;
        
        // 3-6 orders per user
        const numOrders = Math.floor(Math.random() * 4) + 3;
        for (let i=0; i<numOrders; i++) {
            const address = userAddresses[Math.floor(Math.random() * userAddresses.length)];
            
            // Random items for this order
            const numItems = Math.floor(Math.random() * 5) + 1;
            const shuffled = [...products].sort(() => 0.5 - Math.random());
            const items = [];
            let totalAmount = 0;

            for (let j=0; j<numItems; j++) {
                const prod = shuffled[j];
                const qty = Math.floor(Math.random() * 3) + 1;
                const price = prod.discount_price || prod.price;
                items.push({
                    product_id: prod.id,
                    quantity: qty,
                    price: price
                });
                totalAmount += (price * qty);
            }

            const isDiscounted = Math.random() > 0.7;
            const discountAmount = isDiscounted ? Math.floor(totalAmount * 0.1) : 0;
            const finalAmount = totalAmount - discountAmount;
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentStatus = status === "Delivered" ? "Paid" : (status === "Cancelled" ? "Refunded" : "Pending");

            orders.push({
                user_id: user.id,
                address_id: address.id, // Need to make sure address is already inserted and has ID. Wait, address IDs might be DB generated!
                // To handle address IDs, we will pass the DB-inserted addresses array.
                total_amount: totalAmount,
                payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                payment_status: paymentStatus,
                order_status: status,
                coupon_code: isDiscounted ? "FARM10" : null,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                created_at: pastDate(180),
                items: items
            });
        }
    }
    return orders;
};
