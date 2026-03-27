-- Default station profiles (all configurable via admin)
INSERT INTO station_profiles (name, can_submit, can_set_in_progress, can_set_completed, can_skip_to_completed, subscribe_to_stations, display_config, display_order) VALUES
(
    'Front Window', true, false, true, true,
    'Front Window',
    '{"showCompleted": true, "completedDisplay": "collapsed", "orderGroups": ["PENDING", "IN_PROGRESS", "COMPLETED"]}',
    1
),
(
    'Phone', true, false, false, false,
    'Phone',
    '{"showCompleted": false, "orderGroups": ["PENDING", "IN_PROGRESS"]}',
    2
),
(
    'App', true, false, false, false,
    'App',
    '{"showCompleted": false, "orderGroups": ["PENDING", "IN_PROGRESS"]}',
    3
),
(
    'Kitchen', false, true, false, false,
    NULL,
    '{"showCompleted": false, "orderGroups": ["PENDING", "IN_PROGRESS"]}',
    4
),
(
    'Backdoor', false, false, true, true,
    'Phone',
    '{"showCompleted": true, "completedDisplay": "collapsed", "orderGroups": ["PENDING", "IN_PROGRESS", "COMPLETED"]}',
    5
);

-- Placeholder menu items (admin adds real ones)
INSERT INTO menu_items (name, price, display_order) VALUES
('Halibut and Chips', 18.00, 1),
('Cod and Chips', 15.00, 2),
('Chips', 5.00, 3);

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
    SELECT id, 'Halibut', 1 FROM menu_items WHERE name = 'Halibut and Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
    SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Halibut and Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
    SELECT id, 'Cod', 1 FROM menu_items WHERE name = 'Cod and Chips';
INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
    SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Cod and Chips';

INSERT INTO menu_item_components (menu_item_id, component_name, component_quantity)
    SELECT id, 'Chips', 1 FROM menu_items WHERE name = 'Chips';
