const {
  chainAsync,
} = require('@new4/utils');

const videoLinks = require('../.cache/videoLinks.json');
const download = require('./download');

const fns = videoLinks.map(({
  title,
  link,
}) => async (next) => {
  await download(title, link);
  next && next();
});

chainAsync(fns);
