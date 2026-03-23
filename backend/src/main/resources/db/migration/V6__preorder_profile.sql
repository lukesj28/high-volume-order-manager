INSERT INTO station_profiles (name, can_submit, can_set_in_progress, can_set_completed, can_skip_to_completed, subscribe_to_stations, display_config, display_order)
VALUES (
    'Preorder', true, false, false, false,
    'Preorder',
    '{"showCompleted": false, "orderGroups": ["PENDING", "IN_PROGRESS"], "submitFields": ["name", "phone", "pickupTime"]}',
    6
);
