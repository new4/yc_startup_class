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

  // 逐个下载
  while (videoInfo.length) {
    const curr = videoInfo.shift();
    const failed = await download(curr.videoName, curr.link, curr.retry); // eslint-disable-line
    // 失败了加入到队列尾部，随后会重新下载
    failed && videoInfo.push(Object.assign({}, curr, { retry: curr.retry + 1 }));
  }

  successlogBoth('全部下载完成!');
})();
