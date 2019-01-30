const cheerio = require('cheerio');
const download = require('./download');

const {
  cache: Cache,
  chainAsync,
  spinner: {
    logWithSpinner,
    stopSpinner,
  },
  requestP,
  colorStr: {
    yellow,
  },
  log: {
    faillogBoth,
  },
  shouldBe: {
    sb,
  },
} = require('@new4/utils');

const STARTUP_CLASS_URL = 'http://www.startupclass.club';

const cache = new Cache();

async function loadPage(name, url) {
  let response;
  let body;
  try {
    [response, body] = await requestP({
      url,
      timeout: 15000,
    });

    sb(
      () => response.statusCode === 200,
      `[${name} error] res status not 200: ${yellow(url)}`,
    );
  } catch (e) {
    faillogBoth(`[${e.message}] url: ${yellow(url)}`);
    process.exit(1);
  }

  return cheerio.load(body);
}

async function getVideoInfo() {
  const $ = await loadPage('main', STARTUP_CLASS_URL);
  return $('.list-group-item').map((index, ele) => {
    const $ele = $(ele);
    return {
      title: $ele.find('.list-group-item-heading').text().trim(),
      subPage: $ele.attr('href').trim(),
    };
  }).get();
}

async function getVideoLink(info) {
  const $ = await loadPage(info.title, `${STARTUP_CLASS_URL}${info.subPage}`);
  const src = $('video source').attr('src').trim();
  return decodeURIComponent(src);
}

(async () => {
  logWithSpinner('get video info ...');
  const videoInfo = await getVideoInfo();
  Promise
    .all(
      videoInfo.map(async (info) => {
        const link = await getVideoLink(info);
        return { title: info.title, link };
      }),
    )
    .then((videoLinks) => {
      stopSpinner('get video info success!');
      cache.save('videoLinks', videoLinks);
      const fns = videoLinks.map(({ title, link }) => async (next) => {
        await download(title, link);
        next && next();
      });
      chainAsync(fns);
    })
    .catch(err => console.error(err));
})();
