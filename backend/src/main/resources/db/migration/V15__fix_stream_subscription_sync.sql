-- Front Window: remove stale App stream, subscription already correct
UPDATE station_profiles
SET display_config = jsonb_set(
  display_config,
  '{streams}',
  '[{"label": "Window", "stationNames": ["Front Window"]}]'
)
WHERE name = 'Front Window';

-- Backdoor: add Preorder to the single stream, update subscription to match
UPDATE station_profiles
SET
  subscribe_to_stations = 'Phone,Preorder',
  display_config = jsonb_set(
    display_config,
    '{streams}',
    '[{"label": null, "stationNames": ["Phone", "Preorder"]}]'
  )
WHERE name = 'Backdoor';
