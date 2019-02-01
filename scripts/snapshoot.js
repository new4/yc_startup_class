const fse = require('fs-extra');

const {
  fileOp: {
    getExistDirs,
  },
  underPath,
} = require('@new4/utils');

const {
  snapshootDir,
} = require('./utils');

const mindnodeDirs = getExistDirs(underPath('root', 'docs'), name => name.includes('.mindnode'));

mindnodeDirs.forEach((mindnode) => {
  fse.copySync(
    underPath('root', `docs/${mindnode}/QuickLook/Preview.jpg`),
    underPath(snapshootDir, `${mindnode}.jpg`),
  );
});
