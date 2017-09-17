require('./lib/polyfills')
require('./modal')
require('./notif')
require('./appcommon')
try { require('./demo') } catch (err) {}
require('./wifi')
window.termInit = require('./term')
