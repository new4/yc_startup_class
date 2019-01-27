const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');

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
} = require('@new4/utils');

const STARTUP_CLASS_URL = 'http://www.startupclass.club';

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

module.exports = async () => {
  const $ = await loadPage('main', STARTUP_CLASS_URL);

  const info = [];
  $('.list-group-item').each((index, ele) => {
    const $ele = $(ele);
    const title = $ele.find('.list-group-item-heading').text().trim();
    const subPage = $ele.attr('href').trim();
    info.push({
      title,
      subPage,
    });
  });

  console.log(info);

  const srcArr = info.map(async (item) => {
    const $sub = await loadPage(item.title, `${STARTUP_CLASS_URL}${item.subPage}`);
    const src = $sub('video source').attr('src').trim();
    return decodeURIComponent(src);
  });

  console.log(srcArr);

  const $sub = await loadPage(info[0].title, `${STARTUP_CLASS_URL}${info[0].subPage}`);
  const src = $sub('video source').attr('src').trim();
  const url = decodeURIComponent(src);

  request(url)
    .on('error', err => console.log(err))
    .pipe(fs.createWriteStream('asd.mp4'))
    .on('finish', () => console.log('视频下载成功'));
};
