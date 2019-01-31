const download = require('./download');

const {
  serialNumber,
  log: {
    successlogBoth,
  },
} = require('@new4/utils');

const getVideoInfo = require('./getVideoInfo');

(async () => {
  const videoInfo = await getVideoInfo(true);

  while (videoInfo.length) {
    const {
      index,
      title,
      link,
      times,
    } = videoInfo.shift();
    const failed = await download(`${serialNumber(index, 2)} ${title}`, link, times); // eslint-disable-line
    if (failed) {
      // 失败了加入到队列尾部，随后会重新下载
      videoInfo.push({
        index,
        title,
        link,
        times: times + 1,
      });
    }
  }

  successlogBoth('全部下载完成!');
})();
