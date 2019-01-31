const download = require('./download');

const {
  underPath,
  serialNumber,
  colorStr: {
    yellow,
  },
  log: {
    successlog,
    successlogBoth,
  },
  fileOp: {
    getExistFiles,
  },
} = require('@new4/utils');

const { videoDir } = require('./config');

const getVideoInfo = require('./getVideoInfo');

const getFileName = (index, title) => `${serialNumber(index, 2)} ${title}.mp4`;

(async () => {
  const rawVideoInfo = await getVideoInfo(true);
  const existFiles = getExistFiles(underPath('root', videoDir), file => file.includes('.mp4'));

  // 已经下载过了的无需下载
  const videoInfo = rawVideoInfo.reduce(
    (arr, info) => {
      const fileName = getFileName(info.index, info.title);
      const existed = existFiles.includes(fileName);
      if (existed) {
        successlog(`${yellow(fileName)} 已存在，无需下载`);
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
      link,
      times,
    } = videoInfo.shift();
    const failed = await download(getFileName(index, title), link, times); // eslint-disable-line
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
