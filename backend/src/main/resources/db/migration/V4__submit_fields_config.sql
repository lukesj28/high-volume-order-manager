-- Add submitFields to displayConfig for each station profile
-- submitFields controls which extra fields appear in the order submit modal
UPDATE station_profiles SET display_config = display_config || '{"submitFields": []}'::jsonb WHERE name = 'Front Window';
UPDATE station_profiles SET display_config = display_config || '{"submitFields": ["name", "phone"]}'::jsonb WHERE name = 'Phone';
UPDATE station_profiles SET display_config = display_config || '{"submitFields": ["name", "app"]}'::jsonb WHERE name = 'App';
UPDATE station_profiles SET display_config = display_config || '{"submitFields": []}'::jsonb WHERE name = 'Kitchen';
UPDATE station_profiles SET display_config = display_config || '{"submitFields": []}'::jsonb WHERE name = 'Backdoor';
