const path = require('path');
const utils = require('./utils');
const nodeExclude = require('webpack-node-externals');
const webpack = require('webpack');
const webpackconfig = {
  target: 'node', //运行环境
  entry: {
    server: path.join(utils.APP_PATH, 'index.js'),
  },
  output: {
    path: utils.DIST_PATH, //输出的路径，需要绝对路径， //输出的路径，需要绝对路径，
    filename: `[name].bundle.js`, //输出的名字
    clean: true, //清除dist
  },
  // 使用webpack5之后，webpack会从配置文件的mode中自动为process.env.NODE_ENV赋值，而取的值，就是该配置文件的mode属性。如果没有值，则会默认返回“production”。
  // 让webpack不会自动读取配置文件中的mode给process.env.NODE_ENV赋值。
  // 这样process.env.NODE_ENV就只是被我们自定义的文件赋值，就不会冲突了。
  optimization: {
    nodeEnv: false,
  },
  module: {
    rules: [
      // 使用babel-loader，支持ES6语法，排除node_modules文件
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
        },
        exclude: [path.join(__dirname, './node_modules')], //排除node_modules
      },
    ],
  },
  externals: [nodeExclude()], //排除node_modules
  //因为前面的optimization为false，所以这里需要设置EnvironmentPlugin
  //作用：把Node进程里的环境变量，注入到 webpack 打包后的代码中，让代码里可以使用 process.env.NODE_ENV
  //本质是DefinePlugin 的一个方便封装
  //让cross-env NODE_ENV=development控制，
  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV']), // 可以直接使用 environmentPlugin
  ],
};

module.exports = webpackconfig;
