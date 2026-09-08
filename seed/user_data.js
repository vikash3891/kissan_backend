export const generateAddresses = (users) => {
    const addresses = [];
    const areas = ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Jayanagar", "JP Nagar", "Marathahalli", "BTM Layout"];
    
    for (const user of users) {
        // 1-2 addresses per user
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i=0; i<count; i++) {
            addresses.push({
                user_id: user.id,
                full_name: `Customer ${user.id}`,
                phone: user.phone || "9876543210",
                pincode: `5600${Math.floor(Math.random() * 90) + 10}`,
                state: "Karnataka",
                city: "Bangalore",
                house_no: `A-${Math.floor(Math.random() * 999)}`,
                area: areas[Math.floor(Math.random() * areas.length)],
                landmark: "Near Main Park",
                address_type: i === 0 ? "Home" : "Work",
                is_default: i === 0
            });
        }
    }
    return addresses;
};

export const generateCartItems = (users, products) => {
    const cart = [];
    for (const user of users) {
        // random 2-5 items in cart
        const numItems = Math.floor(Math.random() * 4) + 2;
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        for (let i=0; i<numItems; i++) {
            cart.push({
                user_id: user.id,
                product_id: shuffled[i].id,
                quantity: Math.floor(Math.random() * 3) + 1
            });
        }
    }
    return cart;
};

export const generateWishlist = (users, products) => {
    const wishlist = [];
    for (const user of users) {
        // random 3-8 items in wishlist
        const numItems = Math.floor(Math.random() * 6) + 3;
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        for (let i=0; i<numItems; i++) {
            wishlist.push({
                user_id: user.id,
                product_id: shuffled[i].id
            });
        }
    }
    return wishlist;
};
