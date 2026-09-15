INSERT INTO product (id, code, name, description, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'DEMO-OIL-01', 'Óleo motor 5W30 (demo)', 'Fixture de migration para testes locais', NOW(), NOW()),
  ('11111111-1111-4111-8111-111111111102', 'DEMO-FILTER-01', 'Filtro de óleo (demo)', 'Fixture de migration para testes locais', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO product_batch (id, product_code, quantity, cost_price, sale_price, created_at, updated_at)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'DEMO-OIL-01', 100, 25.5, 45.9, NOW(), NOW()),
  ('22222222-2222-4222-8222-222222222202', 'DEMO-FILTER-01', 50, 12, 28.5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  updated_at = NOW();

INSERT INTO client (id, name, document, email, status, created_at, updated_at)
VALUES
  ('33333333-3333-4333-8333-333333333301', 'Cliente demo (migration)', '52998224725', 'cliente.demo@local.dev', 'ACTIVE', NOW(), NOW())
ON CONFLICT (document) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO vehicle (id, plate, model, brand, year, created_at, updated_at)
VALUES
  ('44444444-4444-4444-8444-444444444401', 'APL1234', 'Onix', 'Chevrolet', 2022, NOW(), NOW())
ON CONFLICT (plate) DO UPDATE SET
  model = EXCLUDED.model,
  brand = EXCLUDED.brand,
  year = EXCLUDED.year,
  updated_at = NOW();

INSERT INTO catalog_service (id, name, description, base_price, active, default_parts, created_at, updated_at)
VALUES
  (
    '55555555-5555-4555-8555-555555555501',
    'Troca de óleo (demo — 1 peça)',
    'Usa apenas DEMO-OIL-01',
    120,
    TRUE,
    '[{"productCode":"DEMO-OIL-01","quantity":1}]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    'Diagnóstico rápido (demo — sem peças)',
    'Somente mão de obra; sem peças padrão',
    80,
    TRUE,
    '[]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    'Revisão combo (demo — 2 peças)',
    'Óleo + filtro (DEMO-OIL-01 e DEMO-FILTER-01)',
    199.9,
    TRUE,
    '[{"productCode":"DEMO-OIL-01","quantity":1},{"productCode":"DEMO-FILTER-01","quantity":1}]'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  active = EXCLUDED.active,
  default_parts = EXCLUDED.default_parts,
  updated_at = NOW();
