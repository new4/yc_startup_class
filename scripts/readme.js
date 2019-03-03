const fs = require('fs');

const {
  underPath,
  fileOp: {
    getExistFiles,
  },
} = require('@new4/utils');

const {
  snapshootDir,
} = require('./utils');

const HEAD = '# YC Startup Class';

const DESC = '> 📚 辅助学习 YC 的[创业课](http://www.startupclass.club/)';

const useage = fs.readFileSync(underPath('root', 'docs/use.md'));

let markdown = [
  `${HEAD}\n`,
  `${DESC}\n`,
  useage,
  '## 思维导图\n',
];

getExistFiles(snapshootDir).sort()
  .map(name => ({
    name: name.trim().replace('.mindnode.jpg', ''),
    path: `.${underPath(snapshootDir, name).replace(underPath('root'), '')}`.replace(/\s/g, '&#32;'),
  }))
  .forEach((jpginfo) => {
    const {
      name,
      path,
    } = jpginfo;
    markdown = [
      ...markdown,
      `### ${name}`,
      '',
      `![${name}](${path})`,
      '',
    ];
  });

fs.writeFileSync(
  underPath('root', 'README.md'),
  markdown.join('\n'),
);
