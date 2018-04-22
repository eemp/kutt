module.exports = {
  PORT: 3000,

  /* The domain that this website is on, must be absolute starting from protocol */
  DEFAULT_DOMAIN: 'https://kutt.it',

  /* Datasource details */
  DS_CONNECTOR_NAME: 'sqlite',
  DS_CONFIG: {
    file_name: './data/dev.sqlite3',
  },

  /* Neo4j database credential details */
  DB_URI: 'bolt://localhost',
  DB_USERNAME: '',
  DB_PASSWORD: '',

  /* A passphrase to encrypt JWT. Use a long and secure key. */
  JWT_SECRET: 'securekey',

  /*
    Invisible reCaptcha secret key
    Create one in https://www.google.com/recaptcha/intro/
  */
  RECAPTCHA_SECRET_KEY: '',

  /* 
    Google Cloud API to prevent from users from submitting malware URLs.
    Get it from https://developers.google.com/safe-browsing/v4/get-started
  */
  GOOGLE_SAFE_BROWSING_KEY: '',

  /*
    Your email host details to use to send verification emails.
    More info on http://nodemailer.com/
  */
  MAIL_HOST: '',
  MAIL_PORT: 587,
  MAIL_SECURE: false,
  MAIL_USER: '',
  MAIL_PASSWORD: '',
};
