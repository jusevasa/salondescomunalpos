-- Migration: Fix sides model - Add max_sides_count to menu_items
-- This script fixes the conceptual issue with the sides model

-- Step 1: Add max_sides_count column to menu_items
ALTER TABLE menu_items 
ADD COLUMN max_sides_count INTEGER DEFAULT 0;

-- Step 2: Update existing items with reasonable defaults based on current item_sides
-- For items that have sides, set a default max_sides_count
UPDATE menu_items 
SET max_sides_count = 2 
WHERE has_sides = true;

-- Step 3: Simplify item_sides table - remove max_quantity since it's no longer needed
-- The item_sides table now just represents which sides are AVAILABLE for each item
ALTER TABLE item_sides 
DROP COLUMN max_quantity;

-- Step 4: Add comment to clarify the new model
COMMENT ON COLUMN menu_items.max_sides_count IS 'Maximum total number of sides a customer can choose for this item';
COMMENT ON TABLE item_sides IS 'Defines which sides are available for each menu item (many-to-many relationship)';

-- Step 5: Update some example data to show the new model
-- Pollo a la Plancha: customer can choose max 2 sides from available options
UPDATE menu_items 
SET max_sides_count = 2 
WHERE name = 'Pollo a la Plancha';

-- Carne Asada: customer can choose max 3 sides from available options  
UPDATE menu_items 
SET max_sides_count = 3 
WHERE name = 'Carne Asada';

-- Cazuela de Mariscos: customer can choose max 1 side from available options
UPDATE menu_items 
SET max_sides_count = 1 
WHERE name = 'Cazuela de Mariscos';