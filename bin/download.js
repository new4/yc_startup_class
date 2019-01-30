const fs = require('fs');
const request = require('request');
const ProgressBar = require('progress');

const {
  log: {
    logBefore,
    logAfter,
  },
  colorStr: {
    cyan,
    yellow,
  },
  prettyBytes,
} = require('@new4/utils');

module.exports = (name, downloadUrl) => new Promise((resolve, reject) => {
  request(downloadUrl)
    .on('response', (response) => {
      const respLength = response.headers['content-length'];
      logBefore(cyan(`下载 ${yellow(name)}`));
      logAfter(cyan(`大小 ${yellow(prettyBytes(respLength, 5))}`));
      const bar = new ProgressBar('  :bar :percent', {
        complete: '\u001b[102m \u001b[0m', // Bright Green
        incomplete: '\u001b[100m \u001b[0m', // Bright Black
        width: 60,
        total: parseInt(respLength, 10),
      });
      response.on('data', chunk => bar.tick(chunk.length));
    })
    .on('error', () => reject()) // 懒...
    .pipe(fs.createWriteStream(`video/${name}.mp4`))
    .on('finish', () => resolve()); // 懒...
});
