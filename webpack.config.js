const webpack = require('webpack')
const { execSync } = require('child_process')
const path = require('path')

let hash = execSync('git rev-parse --short HEAD').toString().trim()
let lang = process.env.ESP_LANG || 'en'

let plugins = []
let devtool = 'source-map'

if (process.env.ESP_PROD) {
  // ignore demo
  plugins.push(new webpack.IgnorePlugin(/(term|\.)\/demo(?:\.js)?$/))

  // no source maps
  devtool = ''
}

plugins.push(new webpack.optimize.UglifyJsPlugin({
  sourceMap: devtool === 'source-map'
}))

// replace "locale-data" with path to locale data
let locale = process.env.ESP_LANG || 'en'
plugins.push(new webpack.NormalModuleReplacementPlugin(
  /^locale-data$/,
  path.resolve(`lang/${locale}.php`)
))

module.exports = {
  entry: './js',
  output: {
    path: path.resolve(__dirname, 'out', 'js'),
    filename: `app.${hash}-${lang}.js`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'babel-loader'
      },
      {
        test: /lang\/.+?\.php$/,
        loader: './lang/_js-lang-loader.js'
      }
    ]
  },
  devtool,
  plugins
}
