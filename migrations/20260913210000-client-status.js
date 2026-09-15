module.exports = {
  async up(db) {
    await db.collection('client').updateMany(
      { status: { $exists: false } },
      { $set: { status: 'ACTIVE' } },
    );
  },

  async down(db) {
    await db.collection('client').updateMany({}, { $unset: { status: '' } });
  },
};
