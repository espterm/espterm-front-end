let data = require('locale-data')

module.exports = function localize (key) {
  return data[key] || `?${key}?`
}
