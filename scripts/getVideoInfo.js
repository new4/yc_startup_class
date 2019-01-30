const cheerio = require('cheerio');

const {
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
  spinner: {
    logWithSpinner,
    stopSpinner,
  },
} = require('@new4/utils');

const {
  websiteUrl,
} = require('./config');

const {
  cache,
} = require('./utils');

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

/**
 * 获取主页的视频列表信息
 */
async function getVideoList() {
  const $ = await loadPage('main', websiteUrl);
  return $('.list-group-item').map((index, ele) => {
    const $ele = $(ele);
    return {
      title: $ele.find('.list-group-item-heading').text().trim(),
      subPage: $ele.attr('href').trim(),
    };
  }).get();
}

/**
 * 获取各视频页面中视频的链接
 */
async function getVideoLink(info) {
  const $ = await loadPage(info.title, `${websiteUrl}${info.subPage}`);
  const src = $('video source').attr('src').trim();
  return decodeURIComponent(src);
}

module.exports = async () => {
  logWithSpinner('get video info ...');
  const videoList = await getVideoList();
  return new Promise((resolve) => {
    Promise
      .all(videoList.map(async (info) => {
        const link = await getVideoLink(info);
        return {
          title: info.title,
          link,
        };
      }))
      .then((videoInfo) => {
        stopSpinner('get video info success!');
        cache.save('videoInfo', videoInfo);
        resolve(videoInfo);
      })
      .catch(err => console.error(err));
  });
};
