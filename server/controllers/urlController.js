const _ = require('lodash');
const Promise = require('bluebird');
const urlRegex = require('url-regex');
const URL = require('url');
const useragent = require('useragent');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { getStats } = require('../models/url'); // TODO: fix
const config = require('../config');
const prepareResponse = require('../response-prep');

const preservedUrls = [
  'login',
  'logout',
  'signup',
  'reset-password',
  'resetpassword',
  'url-password',
  'settings',
  'stats',
  'verify',
  'api',
  '404',
  'static',
  'images',
];
exports.preservedUrls = preservedUrls;

exports.urlShortener = async ({ app, body, user }, res) => {
  const { Url } = app.models;
  if (!body.target) return res.status(400).json({ error: 'No target has been provided.' });
  if (body.target.length > 1024) {
    return res.status(400).json({ error: 'Maximum URL length is 1024.' });
  }
  const isValidUrl = urlRegex({ exact: true, strict: false }).test(body.target);
  if (!isValidUrl) return res.status(400).json({ error: 'URL is not valid.' });
  const hasProtocol = /^https?/.test(URL.parse(body.target).protocol);
  const target = hasProtocol ? body.target : `http://${body.target}`;
  if (body.password && body.password.length > 64) {
    return res.status(400).json({ error: 'Maximum password length is 64.' });
  }
  if (user && body.customurl) {
    if (!/^[a-zA-Z1-9-_]+$/g.test(body.customurl.trim())) {
      return res.status(400).json({ error: 'Custom URL is not valid.' });
    }
    if (preservedUrls.some(url => url === body.customurl)) {
      return res.status(400).json({ error: "You can't use this custom URL name." });
    }
    if (body.customurl.length > 64) {
      return res.status(400).json({ error: 'Maximum custom URL length is 64.' });
    }
    const urls = await Url.find({ where: { short: body.customurl } });
    if (urls.length) {
      return res.status(400).json({ error: 'Custom URL is already in use.' });
    }
  }
  const isMalware =
    config.GOOGLE_SAFE_BROWSING_KEY &&
    (await axios
      .post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${
          config.GOOGLE_SAFE_BROWSING_KEY
        }`,
        {
          client: {
            clientId: config.DEFAULT_DOMAIN.toLowerCase().replace('.', ''),
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
            platformTypes: ['WINDOWS'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: body.target }],
          },
        }
      ).then(data => data && data.matches)) // eslint-disable-line
  if (isMalware.data && isMalware.data.matches) {
    return res.status(400).json({ error: 'Malware detected!' });
  }

  const salt = body.password && (await bcrypt.genSalt(12));
  const hash = body.password && (await bcrypt.hash(body.password, salt));
  const response = await Url.create({
    creator: user.email,
    name: body.name,
    password: hash,
    short: body.customurl,
    target,
  });

  return res.json(prepareResponse(response));
};

const browsersList = ['IE', 'Firefox', 'Chrome', 'Opera', 'Safari', 'Edge'];
const osList = ['Windows', 'Mac Os X', 'Linux', 'Chrome OS', 'Android', 'iOS'];
const botList = ['bot', 'dataminr', 'pinterest', 'yahoo', 'facebook', 'crawl'];
const filterInBrowser = agent => item =>
  agent.family.toLowerCase().includes(item.toLocaleLowerCase());
const filterInOs = agent => item =>
  agent.os.family.toLowerCase().includes(item.toLocaleLowerCase());

exports.goToUrl = async (req, res, next) => {
  const { Url, Visit } = req.app.models;
  const id = req.params.id || req.body.id;
  const agent = useragent.parse(req.headers['user-agent']);
  const [browser = 'Other'] = browsersList.filter(filterInBrowser(agent));
  const [os = 'Other'] = osList.filter(filterInOs(agent));
  const referrer = req.header('Referer') && URL.parse(req.header('Referer')).hostname;
  const url = await Url.findOne({ where: { short: id } });
  const isBot =
    botList.some(bot => agent.source.toLowerCase().includes(bot)) || agent.family === 'Other';
  if (!url) return next();
  if (url.password && !req.body.password) {
    req.protectedUrl = id;
    return next();
  }
  if (url.password) {
    const isMatch = await bcrypt.compare(req.body.password, url.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password is not correct' });
    }
    if (url.user && !isBot) {
      await Visit.create({
        browser,
        url: url.short,
        os,
        referrer: referrer || 'Direct',
      });
    }
    return res.status(200).json({ target: url.target });
  }
  if (url.user && !isBot) {
    await Visit.create({
      browser,
      url: url.short,
      os,
      referrer: referrer || 'Direct',
    });
  }
  return res.redirect(url.target);
};

exports.getUrls = async ({ app, query, user }, res) => {
  const { Url } = app.models;
  const { count, page, search = '' } = query;
  const filter = {
    and: _.concat(
      [{ creator: user.id }],
      search ? { or: [{ short: { like: search } }, { target: { like: search } }] } : []
    ),
  };
  const urlsList = await Promise.props({
    list: Url.find({
      limit: count,
      skip: page * count,
      where: filter,
    }),
    countAll: Url.count(filter),
  });
  return res.json(urlsList);
};

exports.deleteUrl = ({ app, body: { id } }, res) => {
  const { Url } = app.models;
  if (!id) return res.status(400).json({ error: 'No id has been provided.' });
  return Url.destroyById(id);
};

exports.getStats = async ({ query: { short }, user }, res) => {
  if (!short) return res.status(400).json({ error: 'No url short has been provided.' });
  const stats = await getStats({ short, user });
  if (!stats) return res.status(400).json({ error: 'Could not get the short URL stats.' });
  return res.status(200).json(stats);
};
