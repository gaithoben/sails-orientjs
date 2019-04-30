module.exports = {
  normalizeDatastoreConfig: require('./normalize-datastore-config'),
  registerDataStore: require('./register-data-store'),
  teardown: require('./teardown'),
  select: require('./find'),
  create: require('./create'),
  createEach: require('./create-each'),
  update: require('./update'),
  destroy: require('./destroy'),
  sum: require('./sum'),

  count: require('./count'),
};
