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
    p.created_at,

    json_build_object(

        'id', c.id,
        'name', c.name,
        'image_url', c.image_url

    ) AS category

FROM products p

LEFT JOIN categories c

ON p.category_id = c.id
`;