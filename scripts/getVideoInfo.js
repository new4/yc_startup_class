const cheerio = require('cheerio');

const {
  requestP,
  colorStr: {
    yellow,
  },
  log: {
    successlogBoth,
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

/**
 * 爬页面获取视频列表信息（视频名+下载链接）
 * 参数 useCache 指定优先使用 cache 中的数据
 */
module.exports = useCache => new Promise(async (resolve) => {
  const videoInfo = cache.get('videoInfo');
  if (useCache && videoInfo) {
    successlogBoth('get video info from cache');
    resolve(videoInfo);
    return;
  }
  logWithSpinner('get video info ...');
  const videoList = await getVideoList();
  Promise
    .all(videoList.map(async (info, index) => {
      const link = await getVideoLink(info);
      return {
        index: index + 1, // 视频序号
        title: info.title, // 视频标题
        link, // 下载链接
        times: 1, // 下载次数
      };
    }))
    .then((videoinfo) => {
      stopSpinner('get video info success!');
      cache.save('videoinfo', videoinfo);
      resolve(videoinfo);
    })
    .catch(err => console.error(err));
});
