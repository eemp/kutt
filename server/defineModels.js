const _ = require('lodash');

const urlDefinition = require('./models/url.json');
const urlFn = require('./models/url.js');
const userDefinition = require('./models/user.json');
const visitDefinition = require('./models/visit.json');

module.exports = dataSource => {
  const models = {
    Url: defineModel(dataSource, urlDefinition, urlFn),
    User: defineModel(dataSource, userDefinition),
    Visit: defineModel(dataSource, visitDefinition),
  };

  return models;
};

function defineModel(dataSource, modelDefinition, modelFn) {
  const { name, properties } = modelDefinition;
  const model = dataSource.define(name, properties);
  if (_.isFunction(modelFn)) {
    modelFn(model);
  }
  return model;
}
