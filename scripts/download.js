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

module.exports = (name, downloadUrl, times) => new Promise((resolve) => {
  let failed = false;
  const videoFile = `${videoDir}/${name}`;
  request(downloadUrl)
    .on('response', (response) => {
      const respLength = response.headers['content-length'];
      const splitLine = '-'.repeat(70);
      const size = cyan(`大小 ${yellow(prettyBytes(respLength, 5))}`);
      const retry = times > 1 ? green(`重新下载: 第 ${yellow(times)} 次`) : '';

      log(grey(splitLine));
      log(cyan(`下载 ${yellow(name)} ${retry}`));
      logAfter(size);

      const bar = new ProgressBar('  :bar :percent', {
        complete: '\u001b[102m \u001b[0m', // Bright Green
        incomplete: '\u001b[100m \u001b[0m', // Bright Black
        width: 60,
        total: parseInt(respLength, 10),
      });

      response.on('data', chunk => bar.tick(chunk.length));

      response.on('end', () => {
        if (!response.complete) {
          bar.terminate();
          failed = true;
        }
      });

      response.on('error', () => {
        bar.terminate();
        failed = true;
      }); // 懒...

      // 中途收到 SIGINT 信号，删除当前正在下载的文件
      process.on('SIGINT', () => {
        bar.terminate();
        faillogBoth('中途退出，删除当前未完成的文件');
        fs.unlinkSync(videoFile);
        process.exit(1);
      });
    })
    .pipe(fs.createWriteStream(videoFile))
    .on('finish', () => {
      if (failed) {
        fs.unlinkSync(videoFile);
        faillogBoth('下载失败，删除失败的文件，稍后自动重新下载');
      } else {
        successlogBoth(`${yellow(name)} 下载成功!`);
      }
      resolve(failed);
    }); // 懒...
});
