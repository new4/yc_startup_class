const {
  log: {
    successlogBoth,
  },
  spinner: {
    logWithSpinner,
    stopSpinner,
  },
} = require('@new4/utils');

const {
  cache,
  loadPage,
  websiteUrl,
  videoNameFormat,
} = require('./utils');

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
 */
module.exports = () => new Promise(async (resolve) => {
  const videoInfo = cache.get('videoInfo');
  if (videoInfo) {
    successlogBoth('get video info from cache');
    resolve(videoInfo);
    return;
  }
  logWithSpinner('get video info ...');
  const videoList = await getVideoList();
  Promise
    .all(videoList.map(async (info, i) => {
      const link = await getVideoLink(info);
      const index = i + 1;
      const { title } = info;
      const videoName = videoNameFormat(index, title);
      return {
        index, // 视频序号
        title, // 视频标题
        videoName, // 视频文件名
        link, // 下载链接
        retry: 0, // 重新下载的次数
      };
    }))
    .then((videoinfo) => {
      stopSpinner('get video info success!');
      cache.save('videoinfo', videoinfo);
      resolve(videoinfo);
    })
    .catch(err => console.error(err));
});
