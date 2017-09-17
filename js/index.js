require('./lib/polyfills')
require('./modal')
require('./notif')
require('./appcommon')
try { require('./demo') } catch (err) {}
require('./wifi')

const $ = require('./lib/chibi')
const { qs, cr } = require('./utils')
const tr = require('./lang')

/* Export stuff to the global scope for inline scripts */
window.termInit = require('./term')
window.$ = $
window.tr = tr
window.qs = qs
window.cr = cr
