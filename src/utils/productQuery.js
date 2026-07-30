
export const PRODUCT_SELECT = `
SELECT

    p.id,
    p.name,
    p.description,
    p.price,
    p.discount_price,
    p.stock,
    p.image_url,
    p.brand,
    p.unit,
    p.is_available,
    p.is_active,
    p.is_archived,
    p.created_at,

    CASE

        WHEN p.stock <= 0
        THEN 'Out of Stock'

        WHEN p.stock <= 10
        THEN 'Low Stock'

        ELSE 'In Stock'

    END AS stock_status,

    json_build_object(

        'id', c.id,
        'name', c.name,
        'image_url', c.image_url

    ) AS category

FROM products p

LEFT JOIN categories c

ON p.category_id = c.id
`;