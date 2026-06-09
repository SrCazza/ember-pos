-- Actualiza image_url de los 20 platos demo con fotos de Unsplash
-- Las URLs usan ?w=400&h=300&fit=crop&q=80 para optimizar el tamaño

-- CARNES AL CARBÓN
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop&q=80'
WHERE name = 'Picaña (250g)';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&q=80'
WHERE name = 'T-Bone Steak (300g)';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'
WHERE name = 'Costillas BBQ (500g)';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop&q=80'
WHERE name = 'Lomo Saltado';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop&q=80'
WHERE name = 'Chorizo Parrillero';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80'
WHERE name = 'Hamburguesa Gourmet';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=400&h=300&fit=crop&q=80'
WHERE name = 'Brocheta de Pollo';

-- ENTRADAS Y FRÍOS
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&h=300&fit=crop&q=80'
WHERE name = 'Ceviche Clásico';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1599487489012-6c3fb1dae64d?w=400&h=300&fit=crop&q=80'
WHERE name = 'Causa Rellena';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80'
WHERE name = 'Ensalada Caesar';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400&h=300&fit=crop&q=80'
WHERE name = 'Carpaccio de Res';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop&q=80'
WHERE name = 'Tabla de Quesos';

-- POSTRES
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80'
WHERE name = 'Tiramisú';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80'
WHERE name = 'Brownie con Helado';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&q=80'
WHERE name = 'Cheesecake Maracuyá';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&h=300&fit=crop&q=80'
WHERE name = 'Mousse de Chocolate';

-- BEBIDAS
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&q=80'
WHERE name = 'Agua Mineral';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop&q=80'
WHERE name = 'Limonada Natural';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop&q=80'
WHERE name = 'Chicha Morada';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop&q=80'
WHERE name = 'Pisco Sour';
