-- Disable previously seeded dummy menu items (if they exist) so they don't appear in the new menu
UPDATE menu_items SET active = false;

-- Insert new default menu items with exact prices as integers (cents) based on V13 migration
INSERT INTO menu_items (name, price, display_order, active) VALUES
('Haddock & Chips', 1588, 1, true),
('Cod & Chips', 1411, 2, true),
('Halibut & Chips', 1942, 3, true),
('Haddock', 1411, 4, true),
('Cod', 1234, 5, true),
('Halibut', 1765, 6, true),
('Chicken Fingers & Chips', 1765, 7, true),
('Caesar Salad', 792, 8, true),
('Coleslaw (Small)', 350, 9, true),
('Coleslaw (Medium)', 438, 10, true),
('Coleslaw (Large)', 615, 11, true),
('Beets (Small)', 350, 12, true),
('Beets (Medium)', 438, 13, true),
('Beets (Large)', 615, 14, true),
('Mushie Peas (Small)', 350, 15, true),
('Mushie Peas (Medium)', 438, 16, true),
('Mushie Peas (Large)', 615, 17, true),
('Gravy (Small)', 173, 18, true),
('Gravy (Medium)', 261, 19, true),
('Gravy (Large)', 350, 20, true),
('Bread & Butter', 349, 24, true),
('Chips', 438, 25, true),
('Kids Chicken Fingers & Chips', 1057, 26, true),
('Kids Fish & Chips', 1057, 27, true),
('Rice Pudding (Small)', 704, 28, true),
('Rice Pudding (Large)', 881, 29, true),
('Trifle (Small)', 704, 30, true),
('Trifle (Large)', 881, 31, true),
('Pop', 261, 32, true),
('Irn Bru', 438, 33, true),
('Bottled Water', 261, 34, true);

-- Add components for analytics/tracking breakdown
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Haddock', 1 FROM menu_items WHERE name = 'Haddock & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Haddock & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Cod', 1 FROM menu_items WHERE name = 'Cod & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Cod & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Halibut', 1 FROM menu_items WHERE name = 'Halibut & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Halibut & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Haddock', 1 FROM menu_items WHERE name = 'Haddock';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Cod', 1 FROM menu_items WHERE name = 'Cod';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Halibut', 1 FROM menu_items WHERE name = 'Halibut';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chicken Fingers', 1 FROM menu_items WHERE name = 'Chicken Fingers & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Chicken Fingers & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Caesar Salad', 1 FROM menu_items WHERE name = 'Caesar Salad';

-- Group sizes into a single component for base prep analytics tracking
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Coleslaw', 1 FROM menu_items WHERE name IN ('Coleslaw (Small)', 'Coleslaw (Medium)', 'Coleslaw (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Beets', 1 FROM menu_items WHERE name IN ('Beets (Small)', 'Beets (Medium)', 'Beets (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Mushie Peas', 1 FROM menu_items WHERE name IN ('Mushie Peas (Small)', 'Mushie Peas (Medium)', 'Mushie Peas (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Gravy', 1 FROM menu_items WHERE name IN ('Gravy (Small)', 'Gravy (Medium)', 'Gravy (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Bread & Butter', 1 FROM menu_items WHERE name = 'Bread & Butter';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Kids Chicken Fingers', 1 FROM menu_items WHERE name = 'Kids Chicken Fingers & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Kids Chicken Fingers & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Kids Fish', 1 FROM menu_items WHERE name = 'Kids Fish & Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Kids Fish & Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Rice Pudding', 1 FROM menu_items WHERE name IN ('Rice Pudding (Small)', 'Rice Pudding (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Trifle', 1 FROM menu_items WHERE name IN ('Trifle (Small)', 'Trifle (Large)');

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Pop', 1 FROM menu_items WHERE name = 'Pop';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Irn Bru', 1 FROM menu_items WHERE name = 'Irn Bru';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
SELECT id, 'Bottled Water', 1 FROM menu_items WHERE name = 'Bottled Water';
