const generate = require('nanoid/generate');

module.exports = Model => {
  Model.observe('before save', (ctx, next) => {
    const { instance } = ctx;
    if (!instance || instance.short) {
      return next();
    }

    instance.short = generateShort();
    return next();
  });
};

function generateShort() {
  return generate('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 5);
}
