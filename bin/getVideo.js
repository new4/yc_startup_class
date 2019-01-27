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
  const videoInfo = await getVideoInfo();
  Promise
    .all(
      videoInfo.map(async (info) => {
        const link = await getVideoLink(info);
        return link;
      }),
    )
    .then((videoLinks) => {
      console.log(videoLinks);
    })
    .catch(err => console.error(err));

  // request(url)
  //   .on('error', err => console.log(err))
  //   .pipe(fs.createWriteStream('asd.mp4'))
  //   .on('finish', () => console.log('视频下载成功'));
})();
