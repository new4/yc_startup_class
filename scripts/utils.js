const cheerio = require('cheerio');

const {
  cache: Cache,
  serialNumber,
  underPath,
  requestP,
  shouldBe: {
    sb,
  },
  colorStr: {
    yellow,
  },
  log: {
    faillogBoth,
  },
  fileOp: {
    getExistFiles,
  },
} = require('@new4/utils');

const websiteUrl = 'http://www.startupclass.club'; // 网站主页

const videoDir = 'video'; // 存放视频的目录

/**
 * 加载网页
 * @param {*} name 页面名字，打印信息使用
 * @param {*} url 页面的 url
 */
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
 * 获取已经存在的视频文件
 */
const getExistVideos = () => getExistFiles(underPath('root', videoDir), file => file.includes('.mp4'));

/**
 * 格式化视频文件名
 * @param {Number} index 第几个视频
 * @param {String} title 视频标题
 */
const videoNameFormat = (index, title) => `${serialNumber(index, 2)} ${title}.mp4`;

module.exports = {
  videoDir,
  websiteUrl,
  cache: new Cache(),
  loadPage,
  getExistVideos,
  videoNameFormat,
  snapshootDir: underPath('root', 'assets/_snapshot'),
};
