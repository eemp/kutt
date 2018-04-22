const config = require('../config');

const { DS_CONNECTOR_NAME, DS_CONFIG } = config;

const dataSource = require('../dataSource')(DS_CONNECTOR_NAME, DS_CONFIG);
const defineModels = require('../defineModels');

defineModels(dataSource);

dataSource.autoupdate(() => {
  console.info('Ran autoupdate!'); // eslint-disable-line no-console
});
