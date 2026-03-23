ALTER TABLE event_days
    ADD COLUMN default_pickup_offset_minutes INT NOT NULL DEFAULT 10,
    ADD COLUMN pickup_slot_interval_minutes   INT NOT NULL DEFAULT 15;

ALTER TABLE orders
    ADD COLUMN pickup_time TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE orders ALTER COLUMN pickup_time DROP DEFAULT;
