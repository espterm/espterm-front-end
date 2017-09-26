const webpack = require('webpack')
const { execSync } = require('child_process')
const path = require('path')

let hash = execSync('git rev-parse --short HEAD').toString().trim()

let plugins = []
let devtool = 'source-map'

if (process.env.ESP_PROD) {
  // ignore demo
  plugins.push(new webpack.IgnorePlugin(/\.\/demo(?:\.js)?$/))

  // no source maps
  devtool = ''
}

plugins.push(new webpack.optimize.UglifyJsPlugin({
  sourceMap: devtool === 'source-map'
}))

module.exports = {
  entry: './js',
  output: {
    path: path.resolve(__dirname, 'out', 'js'),
    filename: `app.${hash}.js`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'babel-loader'
      }
    ]
  },
  devtool,
  plugins
}
