const _ = require('lodash');
const { DataSource } = require('loopback-datasource-juggler');

module.exports = function getDataSource(connector, config) {
  const connectorModule = _.isString(connector)
    ? require(`loopback-connector-${connector}`) // eslint-disable-line
    : connector;
  return new DataSource(connectorModule, config);
};
