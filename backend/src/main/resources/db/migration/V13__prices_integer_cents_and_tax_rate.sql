-- Convert price columns from NUMERIC to INTEGER (cents)
ALTER TABLE menu_items ALTER COLUMN price TYPE INTEGER USING ROUND(price * 100)::INTEGER;
ALTER TABLE order_items ALTER COLUMN unit_price TYPE INTEGER USING ROUND(unit_price * 100)::INTEGER;
ALTER TABLE orders ALTER COLUMN total_price TYPE INTEGER USING ROUND(total_price * 100)::INTEGER;

-- Add tax rate (basis points: 1300 = 13.00%) to event_days (configurable)
ALTER TABLE event_days ADD COLUMN tax_rate_bps INTEGER NOT NULL DEFAULT 1300;

-- Snapshot tax rate on each order at submission time (set by application, no DB default)
ALTER TABLE orders ADD COLUMN tax_rate_bps INTEGER NOT NULL DEFAULT 1300;
ALTER TABLE orders ALTER COLUMN tax_rate_bps DROP DEFAULT;
