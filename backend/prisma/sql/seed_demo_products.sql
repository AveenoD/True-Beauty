-- Inserts two sample products for the tenant with slug "demo" (if none with these ids).
INSERT INTO product (id, "adminId", name, price, status, "stockStatus", images, "categoryName", "createdAt", "updatedAt")
SELECT 'p-demo-001', a.id, 'True Beauty Day Cream', 1299, 'active', 'in_stock', '{}', 'Skincare', NOW(), NOW()
FROM admin a WHERE a.slug = 'demo' LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO product (id, "adminId", name, price, status, "stockStatus", images, "categoryName", "createdAt", "updatedAt")
SELECT 'p-demo-002', a.id, 'True Beauty Serum', 1499, 'active', 'in_stock', '{}', 'Skincare', NOW(), NOW()
FROM admin a WHERE a.slug = 'demo' LIMIT 1
ON CONFLICT (id) DO NOTHING;
