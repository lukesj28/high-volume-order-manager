UPDATE station_profiles
SET display_config = display_config || '{"orderGroups": ["IN_PROGRESS", "PENDING", "COMPLETED"]}'::jsonb
WHERE name = 'Backdoor';
