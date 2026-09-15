CREATE TABLE IF NOT EXISTS client (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle (
  id UUID PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  model VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product (
  id UUID PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_batch (
  id UUID PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL REFERENCES product (code),
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_service (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(12, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  default_parts JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_order (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  client_id UUID NOT NULL REFERENCES client (id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicle (id) ON DELETE RESTRICT,
  client_document VARCHAR(20) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_brand VARCHAR(255) NOT NULL,
  vehicle_model VARCHAR(255) NOT NULL,
  vehicle_year INT NOT NULL,
  requested_services_description TEXT,
  diagnosis TEXT,
  service_lines JSONB NOT NULL DEFAULT '[]',
  part_lines JSONB NOT NULL DEFAULT '[]',
  budget JSONB,
  status_history JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_order_status ON service_order (status);
CREATE INDEX IF NOT EXISTS idx_service_order_client_document ON service_order (client_document);
CREATE INDEX IF NOT EXISTS idx_service_order_vehicle_plate ON service_order (vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_product_batch_code ON product_batch (product_code);
