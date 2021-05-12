/**
 * 类似 @rollup/plugin-replace，用于 tsc 阶段替换 env
 */

const fse = require('fs-extra');
const path = require('path');
const pkg = require('../../package.json');

/**
 * @param {string[]} files
 * @param {Record<string, string>} replacement
 */
exports.replace = (files, replacement) => {
  const keys = Object.keys(replacement)
    .sort((a, b) => b.length - a.length)
    .map((str) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${keys.join('|')})\\b`, 'g');

  return Promise.all(
    files.map(async (file) => {
      let code = await fse.readFile(file, 'utf8');
      let result = false;
      code = code.replace(pattern, (match) => {
        result = true;
        return JSON.stringify(replacement[match]);
      });

      if (result) {
        await fse.writeFile(file, code);
      }
    })
  );
};

const replaceWorkerAndWebviewAssets = async () => {
  const configPath = path.resolve(__dirname, '..', '..', 'packages/toolkit/define.json');
  if (!fse.existsSync(configPath)) {
    throw new Error('请先运行 build-assets 构建资源');
  }

  const targetFiles = [resolveLibFile('api/createApp.js'), resolveLibFile('api/createEditor.js')];

  checkLibFiles(targetFiles);

  return exports.replace(targetFiles, await fse.readJSON(configPath));
};

const replaceVersion = async () => {
  const targetFiles = [resolveLibFile('core/Root.js')];
  checkLibFiles(targetFiles);
  return exports.replace(targetFiles, { __VERSION__: pkg.version });
};

exports.replaceEnv = () => Promise.all([replaceWorkerAndWebviewAssets(), replaceVersion()]);

function resolveLibFile(p) {
  return path.join(__dirname, '../../packages/alex/lib', p);
}

function checkLibFiles(files) {
  if (!files.every((file) => fse.existsSync(file))) {
    throw new Error('请先运行 build 构建 lib');
  }
}
