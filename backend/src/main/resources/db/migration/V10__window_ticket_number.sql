-- Add window-specific ticket number for Front Window orders only
ALTER TABLE orders ADD COLUMN window_ticket_number INT;

-- Unique per day, nulls allowed (only Front Window orders get this)
ALTER TABLE orders ADD CONSTRAINT uq_orders_day_window_ticket UNIQUE (event_day_id, window_ticket_number);

-- Atomic window ticket number per event day (mirrors next_ticket_number pattern)
CREATE OR REPLACE FUNCTION next_window_ticket_number(p_event_day_id UUID) RETURNS INT AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(window_ticket_number), 0) + 1 INTO next_num
    FROM orders
    WHERE event_day_id = p_event_day_id;
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Remove phone from Phone and Preorder station submit fields
UPDATE station_profiles
SET display_config = jsonb_set(
    display_config,
    '{submitFields}',
    (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(display_config->'submitFields') AS elem
        WHERE elem::text != '"phone"'
    )
)
WHERE name IN ('Phone', 'Preorder')
  AND display_config->'submitFields' IS NOT NULL;
