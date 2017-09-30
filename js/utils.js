/** Make a node */
exports.mk = function mk (e) {
  return document.createElement(e)
}

/** Find one by query */
exports.qs = function qs (s) {
  return document.querySelector(s)
}

/** Find all by query */
exports.qsa = function qsa (s) {
  return document.querySelectorAll(s)
}

/**
 * Filter 'spacebar' and 'return' from keypress handler,
 * and when they're pressed, fire the callback.
 * use $(...).on('keypress', cr(handler))
 */
exports.cr = function cr (hdl) {
  return function (e) {
    if (e.which === 10 || e.which === 13 || e.which === 32) {
      hdl()
    }
  }
}

/** Decode number from 2B encoding */
exports.parse2B = function parse2B (s, i = 0) {
  return (s.charCodeAt(i++) - 1) + (s.charCodeAt(i) - 1) * 127
}

/** Decode number from 3B encoding */
exports.parse3B = function parse3B (s, i = 0) {
  return (s.charCodeAt(i) - 1) + (s.charCodeAt(i + 1) - 1) * 127 + (s.charCodeAt(i + 2) - 1) * 127 * 127
}

/** Encode using 2B encoding, returns string. */
exports.encode2B = function encode2B (n) {
  let lsb, msb
  lsb = (n % 127)
  n = ((n - lsb) / 127)
  lsb += 1
  msb = (n + 1)
  return String.fromCharCode(lsb) + String.fromCharCode(msb)
}

/** Encode using 3B encoding, returns string. */
exports.encode3B = function encode3B (n) {
  let lsb, msb, xsb
  lsb = (n % 127)
  n = (n - lsb) / 127
  lsb += 1
  msb = (n % 127)
  n = (n - msb) / 127
  msb += 1
  xsb = (n + 1)
  return String.fromCharCode(lsb) + String.fromCharCode(msb) + String.fromCharCode(xsb)
}
