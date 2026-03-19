-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Station profiles (DB-driven, never hardcoded)
CREATE TABLE station_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    can_submit BOOLEAN NOT NULL DEFAULT false,
    can_set_in_progress BOOLEAN NOT NULL DEFAULT false,
    can_set_completed BOOLEAN NOT NULL DEFAULT false,
    can_skip_to_completed BOOLEAN NOT NULL DEFAULT false,
    subscribe_to_stations TEXT,  -- NULL means subscribe to all; comma-separated station names
    display_config JSONB NOT NULL DEFAULT '{}',
    display_order INT NOT NULL DEFAULT 0
);

-- Event days
CREATE TABLE event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opened_by UUID REFERENCES users(id),
    closed_by UUID REFERENCES users(id),
    label VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu item components (for analytics breakdown)
CREATE TABLE menu_item_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL,
    component_quantity INT NOT NULL DEFAULT 1
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    ticket_number INT NOT NULL,
    event_day_id UUID NOT NULL REFERENCES event_days(id),
    station_profile_id UUID NOT NULL REFERENCES station_profiles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    pickup_name VARCHAR(100),
    source_app VARCHAR(100),
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(event_day_id, ticket_number)
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);

-- Atomic ticket number per event day (avoids race conditions)
CREATE OR REPLACE FUNCTION next_ticket_number(p_event_day_id UUID) RETURNS INT AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO next_num
    FROM orders
    WHERE event_day_id = p_event_day_id;
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Performance indexes
CREATE INDEX idx_orders_event_day ON orders(event_day_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_station ON orders(station_profile_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_event_days_active ON event_days(is_active) WHERE is_active = true;
CREATE INDEX idx_menu_item_components_item ON menu_item_components(menu_item_id);
