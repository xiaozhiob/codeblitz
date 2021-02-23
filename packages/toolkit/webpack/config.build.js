const path = require('path');
const fs = require('fs');
const createWebpackConfig = require('./config.integration');
const { config } = require('./util');
const define = require('../define.json');

process.env.NODE_ENV = 'production';

module.exports = createWebpackConfig({
  mode: 'production',
  tsconfigPath: path.join(__dirname, '../../../tsconfig.json'),
  outputPath: path.join(__dirname, '../../alex/bundle'),
  define: Object.keys(define).reduce((obj, key) => {
    obj[key] = JSON.stringify(define[key]);
    return obj;
  }, {}),
  webpackConfig: {
    context: path.join(__dirname, '../../..'),
    entry: {
      [config.appEntry]: './packages/alex/src/index',
    },
    output: {
      library: 'Alex',
      libraryTarget: 'umd',
    },
    externals: [
      {
        react: {
          root: 'React',
          commonjs2: 'react',
          commonjs: 'react',
          amd: 'react',
        },
        'react-dom': {
          root: 'ReactDOM',
          commonjs2: 'react-dom',
          commonjs: 'react-dom',
          amd: 'react-dom',
        },
      },
      /^antd/,
    ],
    optimization: {
      minimize: false,
    },
  },
});