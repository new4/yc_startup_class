const fs = require('fs');
const request = require('request');

const ProgressBar = require('progress');

const {
  prettyBytes,
} = require('@new4/utils');

const URL = 'http://7oxett.com1.z0.glb.clouddn.com/video/1_cn_new.mp4';

request(URL)
  .on('response', (response) => {
    console.log(response.statusCode); // 200
    console.log(prettyBytes(response.headers['content-length'], 5, false)); // 'image/png'

    // response.on('data', (data) => {
    //   console.log('received ' + data.length + ' bytes of compressed data')
    // })
    const len = parseInt(response.headers['content-length'], 10);

    console.log();
    const bar = new ProgressBar('  downloading [:bar] :rate/bps :percent :etas :current/:total', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len,
    });

    response.on('data', function (chunk) {
      bar.tick(chunk.length);
    });

    response.on('end', function () {
      console.log('\n');
    });
  })
  // .on('data', (data) => {
  //   console.log('@@####');
  //   console.log(data.length); // 200
  // })
  .on('error', err => console.log(err))
  .pipe(fs.createWriteStream('asd.mp4'))
  .on('finish', () => console.log('视频下载成功'));
