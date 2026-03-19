-- Add streams display config to each station profile
UPDATE station_profiles SET display_config = display_config || '{"streams": [{"label": "Window", "stationNames": ["Front Window"]}, {"label": "App", "stationNames": ["App"]}]}'::jsonb WHERE name = 'Front Window';
UPDATE station_profiles SET display_config = display_config || '{"streams": [{"label": null, "stationNames": ["Phone"]}]}'::jsonb WHERE name = 'Phone';
UPDATE station_profiles SET display_config = display_config || '{"streams": [{"label": null, "stationNames": ["App"]}]}'::jsonb WHERE name = 'App';
UPDATE station_profiles SET display_config = display_config || '{"streams": [{"label": null, "stationNames": null}]}'::jsonb WHERE name = 'Kitchen';
UPDATE station_profiles SET display_config = display_config || '{"streams": [{"label": null, "stationNames": ["Phone"]}]}'::jsonb WHERE name = 'Backdoor';
