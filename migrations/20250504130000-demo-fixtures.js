const DEMO_PRODUCTS = [
  {
    _id: '11111111-1111-4111-8111-111111111101',
    code: 'DEMO-OIL-01',
    name: 'Óleo motor 5W30 (demo)',
    description: 'Fixture de migration para testes locais',
  },
  {
    _id: '11111111-1111-4111-8111-111111111102',
    code: 'DEMO-FILTER-01',
    name: 'Filtro de óleo (demo)',
    description: 'Fixture de migration para testes locais',
  },
];

const DEMO_BATCH_IDS = [
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202',
];

const DEMO_CLIENT = {
  _id: '33333333-3333-4333-8333-333333333301',
  name: 'Cliente demo (migration)',
  document: '52998224725',
  email: 'cliente.demo@local.dev',
  status: 'ACTIVE',
};

const DEMO_VEHICLE = {
  _id: '44444444-4444-4444-8444-444444444401',
  plate: 'APL-1234',
  model: 'Onix',
  brand: 'Chevrolet',
  year: 2022,
};

module.exports = {
  async up(db) {
    const now = new Date();

    for (const p of DEMO_PRODUCTS) {
      await db.collection('product').replaceOne(
        { code: p.code },
        {
          ...p,
          createdAt: now,
          updatedAt: now,
        },
        { upsert: true },
      );
    }

    await db.collection('product_batches').replaceOne(
      { _id: DEMO_BATCH_IDS[0] },
      {
        _id: DEMO_BATCH_IDS[0],
        productCode: 'DEMO-OIL-01',
        quantity: 100,
        costPrice: 25.5,
        salePrice: 45.9,
        createdAt: now,
        updatedAt: now,
      },
      { upsert: true },
    );

    await db.collection('product_batches').replaceOne(
      { _id: DEMO_BATCH_IDS[1] },
      {
        _id: DEMO_BATCH_IDS[1],
        productCode: 'DEMO-FILTER-01',
        quantity: 50,
        costPrice: 12,
        salePrice: 28.5,
        createdAt: now,
        updatedAt: now,
      },
      { upsert: true },
    );

    await db.collection('client').replaceOne(
      { document: DEMO_CLIENT.document },
      {
        ...DEMO_CLIENT,
        createdAt: now,
        updatedAt: now,
      },
      { upsert: true },
    );

    await db.collection('vehicle').replaceOne(
      { plate: DEMO_VEHICLE.plate },
      {
        ...DEMO_VEHICLE,
        createdAt: now,
        updatedAt: now,
      },
      { upsert: true },
    );
  },

  async down(db) {
    await db.collection('product_batches').deleteMany({
      _id: { $in: DEMO_BATCH_IDS },
    });
    await db.collection('product').deleteMany({
      code: { $in: DEMO_PRODUCTS.map((p) => p.code) },
    });
    await db.collection('client').deleteOne({
      document: DEMO_CLIENT.document,
    });
    await db.collection('vehicle').deleteOne({
      plate: DEMO_VEHICLE.plate,
    });
  },
};
