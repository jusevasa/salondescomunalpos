-- Script para crear menú de prueba
-- Ejecutar después de la creación del esquema principal

-- Insertar categorías de menú y obtener sus IDs
WITH categoria_entradas AS (
  INSERT INTO menu_categories (name, description, active, display_order, print_station_id) 
  VALUES ('Entradas', 'Aperitivos y entradas para compartir', true, 1, 2)
  RETURNING id
),
categoria_principales AS (
  INSERT INTO menu_categories (name, description, active, display_order, print_station_id) 
  VALUES ('Platos Principales', 'Carnes, pollo y platos fuertes', true, 2, 1)
  RETURNING id
),
categoria_bebidas AS (
  INSERT INTO menu_categories (name, description, active, display_order, print_station_id) 
  VALUES ('Bebidas', 'Bebidas frías y calientes', true, 3, 2)
  RETURNING id
),
categoria_postres AS (
  INSERT INTO menu_categories (name, description, active, display_order, print_station_id) 
  VALUES ('Postres', 'Dulces y postres caseros', true, 4, 1)
  RETURNING id
),
categoria_desayunos AS (
  INSERT INTO menu_categories (name, description, active, display_order, print_station_id) 
  VALUES ('Desayunos', 'Opciones de desayuno', true, 5, 1)
  RETURNING id
)

-- Insertar elementos del menú usando los IDs reales de las categorías
INSERT INTO menu_items (name, price, base_price, category_id, active, tax, fee, author, has_cooking_point, has_sides)
SELECT * FROM (
  -- ENTRADAS
  SELECT 'Patacones con Guacamole', 12000.00, 10000.00, categoria_entradas.id, true, 0.08, 500.00, 'Chef Juan', false, false FROM categoria_entradas
  UNION ALL
  SELECT 'Empanadas de Carne (3 unidades)', 8000.00, 7000.00, categoria_entradas.id, true, 0.08, 300.00, 'Chef Juan', false, false FROM categoria_entradas
  UNION ALL
  SELECT 'Deditos de Queso', 15000.00, 13000.00, categoria_entradas.id, true, 0.08, 800.00, 'Chef María', false, false FROM categoria_entradas
  UNION ALL
  SELECT 'Nachos Especiales', 18000.00, 16000.00, categoria_entradas.id, true, 0.08, 1000.00, 'Chef Pedro', false, true FROM categoria_entradas
  
  UNION ALL
  
  -- PLATOS PRINCIPALES
  SELECT 'Bandeja Paisa', 28000.00, 25000.00, categoria_principales.id, true, 0.08, 1500.00, 'Chef Juan', false, true FROM categoria_principales
  UNION ALL
  SELECT 'Pollo a la Plancha', 22000.00, 20000.00, categoria_principales.id, true, 0.08, 1200.00, 'Chef María', true, true FROM categoria_principales
  UNION ALL
  SELECT 'Carne Asada', 32000.00, 28000.00, categoria_principales.id, true, 0.08, 2000.00, 'Chef Pedro', true, true FROM categoria_principales
  UNION ALL
  SELECT 'Cazuela de Mariscos', 35000.00, 32000.00, categoria_principales.id, true, 0.08, 2200.00, 'Chef Ana', false, true FROM categoria_principales
  UNION ALL
  SELECT 'Lomo de Cerdo', 26000.00, 24000.00, categoria_principales.id, true, 0.08, 1400.00, 'Chef Carlos', true, true FROM categoria_principales
  UNION ALL
  SELECT 'Trucha al Ajillo', 24000.00, 22000.00, categoria_principales.id, true, 0.08, 1300.00, 'Chef Ana', false, true FROM categoria_principales
  
  UNION ALL
  
  -- BEBIDAS
  SELECT 'Limonada Natural', 6000.00, 5000.00, categoria_bebidas.id, true, 0.08, 300.00, 'Barista Luis', false, false FROM categoria_bebidas
  UNION ALL
  SELECT 'Jugo de Naranja', 7000.00, 6000.00, categoria_bebidas.id, true, 0.08, 400.00, 'Barista Luis', false, false FROM categoria_bebidas
  UNION ALL
  SELECT 'Café Americano', 4000.00, 3500.00, categoria_bebidas.id, true, 0.08, 200.00, 'Barista Ana', false, false FROM categoria_bebidas
  UNION ALL
  SELECT 'Cerveza Nacional', 8000.00, 7000.00, categoria_bebidas.id, true, 0.08, 500.00, 'Barista Luis', false, false FROM categoria_bebidas
  UNION ALL
  SELECT 'Gaseosa', 5000.00, 4500.00, categoria_bebidas.id, true, 0.08, 250.00, 'Barista Luis', false, false FROM categoria_bebidas
  UNION ALL
  SELECT 'Agua', 3000.00, 2500.00, categoria_bebidas.id, true, 0.08, 200.00, 'Barista Luis', false, false FROM categoria_bebidas
  
  UNION ALL
  
  -- POSTRES
  SELECT 'Tres Leches', 12000.00, 10000.00, categoria_postres.id, true, 0.08, 600.00, 'Chef Pastelera', false, false FROM categoria_postres
  UNION ALL
  SELECT 'Flan de Caramelo', 10000.00, 8500.00, categoria_postres.id, true, 0.08, 500.00, 'Chef Pastelera', false, false FROM categoria_postres
  UNION ALL
  SELECT 'Brownie con Helado', 14000.00, 12000.00, categoria_postres.id, true, 0.08, 700.00, 'Chef Pastelera', false, false FROM categoria_postres
  UNION ALL
  SELECT 'Helado (3 bolas)', 8000.00, 7000.00, categoria_postres.id, true, 0.08, 400.00, 'Chef Pastelera', false, false FROM categoria_postres
  
  UNION ALL
  
  -- DESAYUNOS
  SELECT 'Huevos Pericos', 12000.00, 10000.00, categoria_desayunos.id, true, 0.08, 600.00, 'Chef Mañanero', false, true FROM categoria_desayunos
  UNION ALL
  SELECT 'Calentado Paisa', 15000.00, 13000.00, categoria_desayunos.id, true, 0.08, 800.00, 'Chef Mañanero', false, true FROM categoria_desayunos
  UNION ALL
  SELECT 'Arepa con Queso', 8000.00, 7000.00, categoria_desayunos.id, true, 0.08, 400.00, 'Chef Mañanero', false, false FROM categoria_desayunos
  UNION ALL
  SELECT 'Changua', 10000.00, 8500.00, categoria_desayunos.id, true, 0.08, 500.00, 'Chef Mañanero', false, true FROM categoria_desayunos
) AS menu_data;

-- Configurar relaciones de acompañamientos para platos que los permiten
-- Nachos Especiales
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Nachos Especiales' AND s.name IN ('Papas fritas', 'Ensalada');

-- Bandeja Paisa
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Bandeja Paisa' AND s.name IN ('Papas fritas', 'Arroz', 'Yuca', 'Plátano');

-- Pollo a la Plancha
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Pollo a la Plancha' AND s.name IN ('Papas fritas', 'Ensalada', 'Arroz', 'Yuca');

-- Carne Asada
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Carne Asada' AND s.name IN ('Papas fritas', 'Ensalada', 'Arroz', 'Yuca', 'Plátano');

-- Cazuela de Mariscos
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Cazuela de Mariscos' AND s.name IN ('Arroz', 'Plátano');

-- Lomo de Cerdo
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Lomo de Cerdo' AND s.name IN ('Papas fritas', 'Ensalada', 'Arroz', 'Yuca');

-- Trucha al Ajillo
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Trucha al Ajillo' AND s.name IN ('Papas fritas', 'Ensalada', 'Arroz');

-- Huevos Pericos
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Huevos Pericos' AND s.name IN ('Arroz', 'Plátano');

-- Calentado Paisa
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Calentado Paisa' AND s.name IN ('Papas fritas', 'Ensalada', 'Plátano');

-- Changua
INSERT INTO item_sides (menu_item_id, side_id)
SELECT mi.id, s.id
FROM menu_items mi, sides s
WHERE mi.name = 'Changua' AND s.name IN ('Arroz', 'Plátano');

-- Insertar algunas mesas de prueba
INSERT INTO tables (number, capacity, active) VALUES
('1', 4, true),
('2', 6, true),
('3', 2, true),
('4', 8, true),
('5', 4, true),
('6', 4, true),
('7', 6, true),
('8', 2, true),
('Bar-1', 2, true),
('Bar-2', 2, true);

-- Comentario final
-- Este script crea un menú completo de prueba con:
-- - 5 categorías (Entradas, Platos Principales, Bebidas, Postres, Desayunos)
-- - 20 productos variados con precios colombianos
-- - Configuración de acompañamientos para platos principales
-- - 10 mesas de diferentes capacidades
-- - Productos con y sin puntos de cocción
-- - Productos con y sin acompañamientos disponibles