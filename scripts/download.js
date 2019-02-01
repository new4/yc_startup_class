const fs = require('fs');
const request = require('request');
const ProgressBar = require('progress');

const {
  log: {
    log,
    logAfter,
    successlogBoth,
    faillogBoth,
  },
  colorStr: {
    grey,
    cyan,
    green,
    yellow,
  },
  prettyBytes,
} = require('@new4/utils');

const {
  videoDir,
} = require('./config');

// 当前下载项的上下文
const ctx = {
  /**
   * bar - 进度条
   * videoFile - 视频文件
   */
};

// 中途收到 SIGINT 信号，删除当前正在下载的文件
process.on('SIGINT', () => {
  ctx.bar.terminate();
  faillogBoth(`中途退出，删除当前未完成的文件 ${ctx.videoFile}`);
  fs.unlinkSync(ctx.videoFile);
  process.exit(1);
});

module.exports = (name, downloadUrl, times) => new Promise((resolve) => {
  let failed = false;
  ctx.videoFile = `${videoDir}/${name}`;
  request(downloadUrl)
    .on('response', (response) => {
      const respLength = response.headers['content-length'];
      const splitLine = '-'.repeat(70);
      const size = cyan(`大小 ${yellow(prettyBytes(respLength, 5))}`);
      const retry = times > 1 ? green(`重新下载: 第 ${yellow(times)} 次重试`) : '';

      log(grey(splitLine));
      log(cyan(`下载 ${yellow(name)} ${retry}`));
      logAfter(size);

      ctx.bar = new ProgressBar('  :bar :percent', {
        complete: '\u001b[102m \u001b[0m', // Bright Green
        incomplete: '\u001b[100m \u001b[0m', // Bright Black
        width: 60,
        total: parseInt(respLength, 10),
      });

      response.on('data', chunk => ctx.bar.tick(chunk.length));

      response.on('end', () => {
        if (!response.complete) {
          ctx.bar.terminate();
          failed = true;
        }
      });

      response.on('error', () => {
        ctx.bar.terminate();
        failed = true;
      }); // 懒...
    })
    .pipe(fs.createWriteStream(ctx.videoFile))
    .on('finish', () => {
      if (failed) {
        fs.unlinkSync(ctx.videoFile);
        faillogBoth('下载失败，删除失败的文件，稍后自动重新下载');
      } else {
        successlogBoth(`${yellow(name)} 下载成功!`);
      }
      resolve(failed);
    }); // 懒...
});
