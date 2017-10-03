/*
 * This is a Webpack loader that loads the language data by running
 * dump_selected.php.
 */

const { spawnSync } = require('child_process')
const path = require('path')
const selectedKeys = require('./keys')

module.exports = function (source) {
  let child = spawnSync(path.resolve(__dirname, 'dump_selected.php'), selectedKeys, {
    timeout: 10000
  })

  let data
  try {
    data = JSON.parse(child.stdout.toString().trim())
  } catch (err) {
    console.error(`\x1b[31;1m[lang-loader] Failed to parse JSON:`)
    console.error(child.stdout.toString().trim())
    console.error(`\x1b[m`)

    if (err) throw err
  }

  // adapted from webpack/loader-utils
  let remainingRequest = this.remainingRequest
  if (!remainingRequest) {
    remainingRequest = this.loaders.slice(this.loaderIndex + 1)
      .map(obj => obj.request)
      .concat([this.resource]).join('!')
  }

  let currentRequest = this.currentRequest
  if (!currentRequest) {
    remainingRequest = this.loaders.slice(this.loaderIndex)
      .map(obj => obj.request)
      .concat([this.resource]).join('!')
  }

  let map = {
    version: 3,
    file: currentRequest,
    sourceRoot: '',
    sources: [remainingRequest],
    sourcesContent: [source],
    names: [],
    mappings: 'AAAA;AAAA'
  }

  this.callback(null, `/* Generated language file */
module.exports=${JSON.stringify(data)}`, map)
}
