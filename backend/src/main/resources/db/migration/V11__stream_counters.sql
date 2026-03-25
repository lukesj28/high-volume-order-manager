-- Add counter toggle to station profiles
ALTER TABLE station_profiles ADD COLUMN counter_enabled BOOLEAN NOT NULL DEFAULT false;

UPDATE station_profiles SET counter_enabled = true WHERE name = 'Front Window';

-- Per-station per-day counter table (composite PK enforces isolation naturally)
CREATE TABLE station_counters (
    station_profile_id UUID NOT NULL REFERENCES station_profiles(id) ON DELETE CASCADE,
    event_day_id       UUID NOT NULL REFERENCES event_days(id)       ON DELETE CASCADE,
    next_value         INT  NOT NULL DEFAULT 1,
    PRIMARY KEY (station_profile_id, event_day_id)
);

-- Rename window_ticket_number -> stream_ticket_number
ALTER TABLE orders RENAME COLUMN window_ticket_number TO stream_ticket_number;

-- Drop old constraint and replace with per-station+day uniqueness (nulls ignored)
ALTER TABLE orders DROP CONSTRAINT uq_orders_day_window_ticket;
CREATE UNIQUE INDEX uq_orders_stream_ticket
    ON orders(event_day_id, station_profile_id, stream_ticket_number)
    WHERE stream_ticket_number IS NOT NULL;

-- Drop old function
DROP FUNCTION IF EXISTS next_window_ticket_number(UUID);

-- Atomic per-station counter: UPSERT holds row lock, no two transactions get same number
CREATE OR REPLACE FUNCTION next_stream_ticket_number(p_station_profile_id UUID, p_event_day_id UUID)
RETURNS INT AS $$
DECLARE
    assigned_num INT;
BEGIN
    INSERT INTO station_counters (station_profile_id, event_day_id, next_value)
    VALUES (p_station_profile_id, p_event_day_id, 2)
    ON CONFLICT (station_profile_id, event_day_id)
    DO UPDATE SET next_value = station_counters.next_value + 1
    RETURNING next_value - 1 INTO assigned_num;
    RETURN assigned_num;
END;
$$ LANGUAGE plpgsql;
