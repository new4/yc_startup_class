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
} = require('./utils');

// 当前下载项的上下文
const ctx = {
  /**
   * bar - 进度条
   * videoName - 视频文件名
   * filePath - 视频文件（含路径）
   * failed - 下载是否失败的标记
   */
};

// 中途收到 SIGINT 信号，删除当前正在下载的文件
process.on('SIGINT', () => {
  ctx.bar.terminate();
  faillogBoth(`中途退出，删除当前未完成的文件 ${yellow(ctx.videoName)}`);
  fs.unlinkSync(ctx.filePath);
  process.exit(1);
});

module.exports = (videoName, downloadUrl, retry) => new Promise((resolve) => {
  ctx.failed = false; // 初始时至为 false
  ctx.videoName = videoName;
  ctx.filePath = `${videoDir}/${videoName}`;
  ctx.setFailed = () => {
    ctx.bar && ctx.bar.terminate();
    ctx.failed = true;
  };
  request(downloadUrl)
    .on('response', (response) => {
      const respLength = response.headers['content-length'];
      const splitLine = grey('-'.repeat(70));
      const sizeTip = cyan(`大小 ${yellow(prettyBytes(respLength, 5))}`);
      const retryTip = retry ? green(`重新下载: 第 ${yellow(retry)} 次重试`) : '';

      log(splitLine);
      log(cyan(`下载 ${yellow(videoName)} ${retryTip}`));
      logAfter(sizeTip);

      ctx.bar = new ProgressBar('  :bar :percent', {
        complete: '\u001b[102m \u001b[0m', // Bright Green
        incomplete: '\u001b[100m \u001b[0m', // Bright Black
        width: 60,
        total: parseInt(respLength, 10),
      });

      // 跑进度条
      response.on('data', chunk => ctx.bar.tick(chunk.length));

      // 消息仍在发送时终止了连接，将当前的下载置为失败
      response.on('end', () => !response.complete && ctx.setFailed());
      response.on('error', () => ctx.setFailed());
    })
    .pipe(fs.createWriteStream(ctx.filePath))
    .on('finish', () => {
      if (ctx.failed) {
        fs.unlinkSync(ctx.filePath);
        faillogBoth('下载失败，删除失败的文件，稍后自动重新下载');
      } else {
        successlogBoth(`${yellow(videoName)} 下载成功!`);
      }
      resolve(ctx.failed);
    }); // 懒...
});
