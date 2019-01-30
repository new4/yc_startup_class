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
    yellow,
  },
  prettyBytes,
} = require('@new4/utils');

const DIR = 'video';

module.exports = (name, downloadUrl) => new Promise((resolve) => {
  let failed = false;
  const videoFile = `${DIR}/${name}.mp4`;
  request(downloadUrl)
    .on('response', (response) => {
      const respLength = response.headers['content-length'];
      log(grey('-'.repeat(70)));
      log(cyan(`下载 ${yellow(name)}`));
      logAfter(cyan(`大小 ${yellow(prettyBytes(respLength, 5))}`));
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
    })
    .pipe(fs.createWriteStream(videoFile))
    .on('finish', () => {
      if (failed) {
        fs.unlinkSync(videoFile);
        faillogBoth('下载失败，删除无效文件，稍后重新下载');
      } else {
        successlogBoth(`${yellow(name)} 下载成功!`);
      }
      resolve(failed);
    }); // 懒...
});
