const nodemailer = require('nodemailer');
const config = require('../config');

module.exports = config.MAIL_HOST ? getMailTransport() : getFakeMailTransport();

function getMailTransport() {
  return nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: config.MAIL_SECURE,
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASSWORD,
    },
  });
}

function getFakeMailTransport() {
  return {
    sendMail: () => ({
      fakeMail: true,
    }),
  };
}
