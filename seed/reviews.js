export const generateReviews = (users, products) => {
    const reviews = [];
    
    const comments5 = [
        "Excellent quality, very fresh!",
        "Fast delivery and nicely packed.",
        "Worth the money. Premium quality.",
        "Kids loved it! Arrived in perfect condition.",
        "Highly recommended, always fresh.",
        "Organic and fresh, totally worth it.",
        "Amazing taste and quality."
    ];
    
    const comments4 = [
        "Good quality, will buy again.",
        "Fresh and delivered on time.",
        "Nice packaging, satisfactory product.",
        "Good product for the price.",
        "Mostly fresh, a bit expensive though."
    ];
    
    const comments3 = [
        "Average quality, could be better.",
        "Okay product, nothing special.",
        "A bit stale but usable."
    ];
    
    const comments2 = [
        "Not very fresh this time.",
        "Disappointed with the quality."
    ];
    
    const comments1 = [
        "Very poor quality, completely stale.",
        "Terrible experience, arrived damaged."
    ];

    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const pastDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * days));
        return d.toISOString();
    };

    // 5 reviews per product
    for (const product of products) {
        // Shuffle users to avoid unique constraint violations
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
        const reviewers = shuffledUsers.slice(0, 5);
        
        for (const user of reviewers) {
            const r = Math.random();
            let rating = 5;
            let commentList = comments5;
            
            // 5★ → 60%, 4★ → 25%, 3★ → 10%, 2★ → 3%, 1★ → 2%
            if (r > 0.98) { rating = 1; commentList = comments1; }
            else if (r > 0.95) { rating = 2; commentList = comments2; }
            else if (r > 0.85) { rating = 3; commentList = comments3; }
            else if (r > 0.60) { rating = 4; commentList = comments4; }

            const hasImage = Math.random() > 0.7;
            const photo_urls = hasImage ? [product.image_url] : []; // Schema has review_images or photo_urls? We will handle the column structure in the seeder.

            reviews.push({
                user_id: user.id,
                product_id: product.id,
                rating: rating,
                comment: rnd(commentList),
                created_at: pastDate(90),
                images: photo_urls // Neutral key, will map to the correct column during insert
            });
        }
    }
    
    return reviews;
};
