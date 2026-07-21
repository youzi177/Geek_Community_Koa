const webpackMerge = require('webpack-merge')
const baseWbpackConfig = require('./webpack.config.base')
const TerserPlugin = require('terser-webpack-plugin')
const webpackConfig = webpackMerge.merge(baseWbpackConfig, {
  mode: 'production', // 生产模式
  stats: { children: false },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_debugger: true,
            drop_console: false
          },
          format: {
            comments: false
          }
        }
      })
    ]
  }
})
module.exports = webpackConfig
