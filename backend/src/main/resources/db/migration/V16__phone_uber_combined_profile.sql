-- Add routing override column
ALTER TABLE orders ADD COLUMN target_station_name VARCHAR(100);

-- Create combined profile
INSERT INTO station_profiles (name, can_submit, can_set_in_progress, can_set_completed,
  can_skip_to_completed, subscribe_to_stations, display_config, display_order)
VALUES (
  'Phone & Uber', true, false, false, false,
  'Phone,App',
  '{
    "showCompleted": false,
    "orderGroups": ["PENDING", "IN_PROGRESS"],
    "submitFields": ["name", "stream"],
    "streamOptions": [
      {"label": "Phone", "station": "Phone"},
      {"label": "Uber", "station": "App"}
    ],
    "streams": [{"label": null, "stationNames": ["Phone", "App"]}]
  }',
  2
);

-- Move Phone and App to backup (bottom of list, can no longer submit)
UPDATE station_profiles
SET name = 'Phone (BACKUP)', display_order = 90
WHERE name = 'Phone';

UPDATE station_profiles
SET name = 'App (BACKUP)', display_order = 91
WHERE name = 'App';
