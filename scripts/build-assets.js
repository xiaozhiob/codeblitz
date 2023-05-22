/**
 * 构建 worker-host 和 webview 并发布到内网 cdn 上
 */

const path = require('path');
const fs = require('fs');
const signale = require('signale');
const { invoke, exec } = require('./utils/utils');
const { upload } = require('./utils/upload');
const pkg = require('../package.json');

const assetsKeyMap = {
  __WORKER_HOST__: 'worker-host',
  __WEBVIEW_ENDPOINT__: 'webview/index.html',
  __WEBVIEW_ENDPOINT_INTERNAL__: 'internal/webview/index.html',
  __WEBVIEW_SCRIPT__: 'webview',
  __ODPS_WORKER__: 'odps-worker',
  __OB_WORKER__: 'ob-worker',
};

invoke(async () => {
  signale.pending(`开始编译 worker-host 和 webview`);

  await exec('npx rimraf ./packages/toolkit/dist');
  await exec(`yarn workspace @alipay/alex-toolkit build:host`);

  signale.info('构建成功，开始上传 cdn');

  const distDir = path.resolve(__dirname, '../packages/toolkit/dist');
  const manifest = require(path.join(distDir, 'manifest.json'));
  const fileJSON = Object.keys(manifest).reduce((obj, key) => {
    obj[key] = {
      filename: manifest[key],
      filepath: path.join(distDir, manifest[key]),
    };
    return obj;
  }, {});
  fileJSON[assetsKeyMap.__WEBVIEW_ENDPOINT_INTERNAL__] = {
    ...fileJSON[assetsKeyMap.__WEBVIEW_ENDPOINT__],
    mode: 'internal',
  };
  const cdnResult = await upload(fileJSON);

  signale.info('上传成功，生成 define.json');

  const transformHttps = (str) => str.replace(/^http:/, 'https:');
  const env = {
    __WORKER_HOST__: {
      key: assetsKeyMap.__WORKER_HOST__,
      transform: transformHttps,
    },
    __WEBVIEW_ENDPOINT__: {
      key: assetsKeyMap.__WEBVIEW_ENDPOINT__,
      transform: (v) => transformHttps(v.slice(0, v.lastIndexOf('/'))),
    },
    __WEBVIEW_ENDPOINT_INTERNAL__: {
      key: assetsKeyMap.__WEBVIEW_ENDPOINT_INTERNAL__,
      transform: (v) => v.slice(0, v.lastIndexOf('/')),
    },
    __WEBVIEW_SCRIPT__: {
      key: assetsKeyMap.__WEBVIEW_SCRIPT__,
      transform: transformHttps,
    },
    __ODPS_WORKER__: {
      key: assetsKeyMap.__ODPS_WORKER__,
      transform: transformHttps,
    },
    __OB_WORKER__: {
      key: assetsKeyMap.__OB_WORKER__,
      transform: transformHttps,
    }
  };
  const config = Object.keys(env).reduce(
    (obj, name) => {
      const { key, transform } = env[name];
      if (cdnResult[key]) {
        obj[name] = transform(cdnResult[key]);
      }
      return obj;
    },
    { __KAITIAN_VERSION__: pkg.engines.kaitian }
  );

  fs.writeFileSync(
    path.resolve(__dirname, '../packages/toolkit/define.json'),
    JSON.stringify(config, null, 2)
  );

  signale.success('构建资源成功');
});
