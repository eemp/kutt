const _ = require('lodash');
const { URL } = require('url');

const config = require('./config');

module.exports = response => prepareResponse(response);

const OMITTED_DATA_KEYS = [];

function prepareResponse(response) {
  return _.assign(
    {},
    _.omit(response, OMITTED_DATA_KEYS),
    protectPassword(response),
    prepareShortUrl(response)
  );
}

function protectPassword(response) {
  const password = _.get(response, 'password');
  return password !== undefined && { password: !!password };
}

function prepareShortUrl(response) {
  const domain = config.DEFAULT_DOMAIN;
  const short = _.get(response, 'short');
  return short !== undefined && { shortUrl: new URL(`/${short}`, domain) };
}
