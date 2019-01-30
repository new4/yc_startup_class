const download = require('./download');

const {
  chainAsync,
} = require('@new4/utils');

const getVideoInfo = require('./getVideoInfo');

(async () => {
  const videoInfo = await getVideoInfo();
  const fns = videoInfo.map(({
    title,
    link,
  }) => async (next) => {
    await download(title, link);
    next && next();
  });
  chainAsync(fns);
})();
