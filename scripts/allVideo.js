const {
  colorStr: {
    yellow,
  },
  log: {
    successlog,
    successlogBoth,
  },
} = require('@new4/utils');

const download = require('./download');

const {
  getExistVideos,
} = require('./utils');

const getVideoInfo = require('./getVideoInfo');

(async () => {
  const rawVideoInfo = await getVideoInfo();
  const existVideos = getExistVideos();

  // 已经下载过了的无需下载
  const videoInfo = rawVideoInfo.reduce(
    (arr, info) => {
      const { videoName } = info;
      const existed = existVideos.includes(videoName);
      if (existed) {
        successlog(`${yellow(videoName)} 已存在，无需下载`);
        return arr;
      }
      return [...arr, info];
    },
    [],
  );

  while (videoInfo.length) {
    const {
      index,
      title,
      videoName,
      link,
      retry,
    } = videoInfo.shift();
    const failed = await download(videoName, link, retry); // eslint-disable-line
    if (failed) {
      // 失败了加入到队列尾部，随后会重新下载
      videoInfo.push({
        index,
        title,
        link,
        retry: retry + 1,
      });
    }
  }

  successlogBoth('全部下载完成!');
})();
