export const generateProducts = (categoryMap) => {
    const products = [];
    const brands = ["FarmFresh", "Nature's Best", "GreenGrocer", "Premium Imports", "Local Harvest", "Organic Valley"];
    
    // Helper to pick random item
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rndNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pastDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() - rndNum(0, days));
        return d.toISOString();
    };

    const categoryTemplates = {
        "Fruits": [
            { name: "Apple", variations: ["Organic", "Washington", "Shimla", "Kashmiri"], unit: "1 kg", basePrice: 150, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=400" },
            { name: "Banana", variations: ["Local", "Robusta", "Organic"], unit: "1 Dozen", basePrice: 60, image: "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?q=80&w=400" },
            { name: "Mango", variations: ["Alphonso", "Kesar", "Banganapalli"], unit: "1 kg", basePrice: 200, image: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400" },
            { name: "Orange", variations: ["Nagpur", "Imported", "Valencia"], unit: "1 kg", basePrice: 120, image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=400" },
            { name: "Kiwi", variations: ["Imported Green", "Zespri Gold"], unit: "3 pcs", basePrice: 100, image: "https://images.unsplash.com/photo-1585059895524-72359e06138a?q=80&w=400" },
            { name: "Grapes", variations: ["Green Seedless", "Black Premium", "Red Globe"], unit: "500 g", basePrice: 90, image: "https://images.unsplash.com/photo-1596363505729-4190a9506133?q=80&w=400" },
        ],
        "Vegetables": [
            { name: "Onion", variations: ["Red", "White", "Organic", "Nashik"], unit: "1 kg", basePrice: 40, image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=400" },
            { name: "Tomato", variations: ["Hybrid", "Local", "Cherry", "Organic"], unit: "1 kg", basePrice: 50, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400" },
            { name: "Potato", variations: ["Chandramukhi", "Sweet", "Baby", "Regular"], unit: "1 kg", basePrice: 35, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400" },
            { name: "Capsicum", variations: ["Green", "Red & Yellow", "Organic"], unit: "500 g", basePrice: 60, image: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=400" },
            { name: "Spinach", variations: ["Fresh", "Organic Bunch"], unit: "250 g", basePrice: 20, image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=400" },
        ],
        "Grains & Rice": [
            { name: "Basmati Rice", variations: ["Premium", "Everyday", "Organic Brown"], unit: "5 kg", basePrice: 500, image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400" },
            { name: "Wheat Atta", variations: ["Chakki Fresh", "Multigrain", "Organic Whole"], unit: "5 kg", basePrice: 250, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400" },
            { name: "Oats", variations: ["Rolled", "Instant", "Organic"], unit: "1 kg", basePrice: 180, image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=400" }
        ],
        "Pulses & Dal": [
            { name: "Toor Dal", variations: ["Unpolished", "Organic", "Premium"], unit: "1 kg", basePrice: 160, image: "https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?q=80&w=400" },
            { name: "Moong Dal", variations: ["Yellow", "Green Whole", "Organic"], unit: "1 kg", basePrice: 130, image: "https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?q=80&w=400" },
            { name: "Chana Dal", variations: ["Unpolished", "Organic"], unit: "1 kg", basePrice: 90, image: "https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?q=80&w=400" }
        ],
        "Dairy & Milk": [
            { name: "Milk", variations: ["Cow", "Buffalo", "Toned", "Full Cream"], unit: "1 L", basePrice: 65, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400" },
            { name: "Paneer", variations: ["Fresh", "Malai", "Low Fat"], unit: "200 g", basePrice: 85, image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400" },
            { name: "Curd", variations: ["Thick", "Probiotic", "Low Fat"], unit: "400 g", basePrice: 40, image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400" }
        ],
        "Bakery": [
            { name: "Bread", variations: ["White", "Brown", "Multigrain", "Garlic"], unit: "1 Pack", basePrice: 45, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400" },
            { name: "Buns", variations: ["Burger", "Pav", "Sweet"], unit: "1 Pack", basePrice: 30, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400" }
        ],
        "Beverages": [
            { name: "Tea", variations: ["CTC Premium", "Green", "Masala", "Organic"], unit: "250 g", basePrice: 120, image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=400" },
            { name: "Coffee", variations: ["Instant", "Filter", "Roasted Beans"], unit: "100 g", basePrice: 180, image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=400" },
            { name: "Juice", variations: ["Orange", "Mixed Fruit", "Apple 100%"], unit: "1 L", basePrice: 110, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400" }
        ],
        "Dry Fruits & Nuts": [
            { name: "Almonds", variations: ["Premium California", "Organic", "Roasted"], unit: "500 g", basePrice: 450, image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=400" },
            { name: "Cashews", variations: ["Whole Premium", "Broken", "Salted"], unit: "500 g", basePrice: 500, image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400" },
            { name: "Raisins", variations: ["Golden", "Black Premium", "Organic"], unit: "250 g", basePrice: 150, image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400" }
        ],
        "Spices & Masala": [
            { name: "Turmeric Powder", variations: ["Organic", "Premium", "Lakadong"], unit: "200 g", basePrice: 60, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400" },
            { name: "Chilli Powder", variations: ["Kashmiri", "Spicy", "Organic"], unit: "200 g", basePrice: 80, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400" },
            { name: "Garam Masala", variations: ["Authentic", "Punjabi", "Organic"], unit: "100 g", basePrice: 70, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400" }
        ],
        "Oils & Ghee": [
            { name: "Sunflower Oil", variations: ["Refined", "Fortified"], unit: "1 L", basePrice: 140, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400" },
            { name: "Mustard Oil", variations: ["Cold Pressed", "Kachi Ghani", "Organic"], unit: "1 L", basePrice: 180, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400" },
            { name: "Cow Ghee", variations: ["Desi", "A2 Cultured", "Organic"], unit: "500 ml", basePrice: 350, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400" }
        ]
    };

    // To hit 120-150 products, we loop over templates and their variations
    for (const [catName, templates] of Object.entries(categoryTemplates)) {
        const catId = categoryMap[catName];
        if (!catId) continue;

        for (const tmpl of templates) {
            // Generate multiple variations per template to get realistic depth
            for (const variation of tmpl.variations) {
                // Generate 1-2 items per variation
                const isPremium = variation.includes("Premium") || variation.includes("Imported");
                const isOrganic = variation.includes("Organic");
                const isLocal = variation.includes("Local");
                
                let mrp = tmpl.basePrice;
                if (isPremium) mrp = Math.round(mrp * 1.5);
                if (isOrganic) mrp = Math.round(mrp * 1.3);
                
                // Realistic discount: 5% to 25% on most items, some no discount
                const hasDiscount = Math.random() > 0.3; 
                let discountPrice = hasDiscount ? Math.round(mrp * (1 - rndNum(5, 25)/100)) : null;

                // Inventory: some low stock (1-5), out of stock (0), normal (20-150)
                let stock = rndNum(20, 150);
                const stockRoll = Math.random();
                if (stockRoll < 0.1) stock = 0;
                else if (stockRoll < 0.25) stock = rndNum(1, 5);

                const brand = rnd(brands);
                const desc = `Experience the finest ${variation.toLowerCase()} ${tmpl.name.toLowerCase()} sourced directly for your kitchen. Shelf life: ${rndNum(3, 12)} days. Guaranteed quality by ${brand}.`;
                
                products.push({
                    name: `${variation} ${tmpl.name}`,
                    description: desc,
                    price: mrp,
                    discount_price: discountPrice,
                    stock: stock,
                    image_url: tmpl.image,
                    category: catName,
                    category_id: catId,
                    brand: brand,
                    unit: tmpl.unit,
                    is_available: stock > 0,
                    created_at: pastDate(30) // Recent products for 'Trending/New' mix
                });
            }
        }
    }
    return products;
};
