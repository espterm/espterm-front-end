const { execSync } = require('child_process')
const path = require('path')

let hash = execSync('git rev-parse --short HEAD').toString().trim()

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
        loader: 'babel-loader'
      }
    ]
  },
  devtool: 'source-map'
}
