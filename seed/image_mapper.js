const imageDictionary = {
    // Fruits
    "Apple": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=400",
    "Banana": "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?q=80&w=400",
    "Mango": "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400",
    "Orange": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=400",
    "Kiwi": "https://images.unsplash.com/photo-1585059895524-72359e06138a?q=80&w=400",
    "Grape": "https://images.unsplash.com/photo-1596363505729-4190a9506133?q=80&w=400",
    "Watermelon": "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?q=80&w=400",
    "Papaya": "https://images.unsplash.com/photo-1617112848923-cc2234394a8a?q=80&w=400",
    "Pomegranate": "https://images.unsplash.com/photo-1615486171448-4aa2bd3db1c5?q=80&w=400",
    
    // Vegetables
    "Onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=400",
    "Tomato": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400",
    "Potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400",
    "Garlic": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400",
    "Ginger": "https://images.unsplash.com/photo-1615485925600-97237c4ff1cb?q=80&w=400",
    "Cauliflower": "https://images.unsplash.com/photo-1568584711475-3cb60321fb07?q=80&w=400",
    "Cabbage": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?q=80&w=400",
    "Capsicum": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=400",
    "Spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=400",
    "Carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400",
    
    // Grains & Others
    "Rice": "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400",
    "Wheat": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400",
    "Oat": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=400",
    "Dal": "https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?q=80&w=400",
    "Milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400",
    "Paneer": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400",
    "Curd": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400",
    "Bread": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400",
    "Bun": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400",
    "Tea": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=400",
    "Coffee": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=400",
    "Juice": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400",
    "Almond": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=400",
    "Cashew": "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400",
    "Raisin": "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400",
    "Turmeric": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400",
    "Chilli": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400",
    "Masala": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400",
    "Oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400",
    "Ghee": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400"
};

export function getExactImageForProduct(productName) {
    let bestMatch = null;
    let confidence = 0;
    
    const nameLower = productName.toLowerCase();
    
    for (const [key, url] of Object.entries(imageDictionary)) {
        if (nameLower.includes(key.toLowerCase())) {
            // Confidence is 100% if exact match, or high if includes
            bestMatch = url;
            confidence = 100;
            break; 
        }
    }
    
    return { url: bestMatch, confidence };
}
