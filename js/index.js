require('./lib/polyfills')
require('./modal')
require('./notif')
require('./appcommon')
try { require('./term/demo') } catch (err) {}
require('./wifi')

const $ = require('./lib/chibi')
const { qs } = require('./utils')

/* Export stuff to the global scope for inline scripts */
window.termInit = require('./term')
window.$ = $
window.qs = qs

window.themes = require('./term/themes')
