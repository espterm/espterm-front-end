/*
 * Copyright (c) 2010 Tim Baumann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// NOTE:
// Extracted from ColorTriangle and
// Converted to ES6 by MightyPork (2017)

/*******************
 * Color conversion *
 *******************/

const M = Math
const TAU = 2 * M.PI

exports.hue2rgb = function (v1, v2, h) {
  if (h < 0) h += 1
  if (h > 1) h -= 1

  if ((6 * h) < 1) return v1 + (v2 - v1) * 6 * h
  if ((2 * h) < 1) return v2
  if ((3 * h) < 2) return v1 + (v2 - v1) * ((2 / 3) - h) * 6
  return v1
}

exports.hsl2rgb = function (h, s, l) {
  h /= TAU
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    let var_1, var_2

    if (l < 0.5) var_2 = l * (1 + s)
    else var_2 = (l + s) - (s * l)

    var_1 = 2 * l - var_2

    r = exports.hue2rgb(var_1, var_2, h + (1 / 3))
    g = exports.hue2rgb(var_1, var_2, h)
    b = exports.hue2rgb(var_1, var_2, h - (1 / 3))
  }
  return [r, g, b]
}

exports.rgb2hsl = function (r, g, b) {
  const min = M.min(r, g, b)
  const max = M.max(r, g, b)
  const d = max - min // delta

  let h, s, l

  l = (max + min) / 2

  if (d === 0) {
    // gray
    h = s = 0 // HSL results from 0 to 1
  } else {
    // chroma
    if (l < 0.5) s = d / (max + min)
    else s = d / (2 - max - min)

    const d_r = (((max - r) / 6) + (d / 2)) / d
    const d_g = (((max - g) / 6) + (d / 2)) / d
    const d_b = (((max - b) / 6) + (d / 2)) / d // deltas

    if (r === max) h = d_b - d_g
    else if (g === max) h = (1 / 3) + d_r - d_b
    else if (b === max) h = (2 / 3) + d_g - d_r

    if (h < 0) h += 1
    else if (h > 1) h -= 1
  }
  h *= TAU
  return [h, s, l]
}

exports.hex2rgb = function (hex) {
  const groups = hex.match(/^#([\da-f]{3,6})$/i)
  if (groups) {
    hex = groups[1]
    const bytes = hex.length / 3
    const max = (16 ** bytes) - 1
    return [0, 1, 2].map(x => parseInt(hex.slice(x * bytes, (x + 1) * bytes), 16) / max)
  }
  return [0, 0, 0]
}

function pad (n) {
  return `00${n}`.substr(-2)
}

exports.rgb255ToHex = function (r, g, b) {
  return '#' + [r, g, b].map(x => pad(x.toString(16))).join('')
}

exports.rgb2hex = function (r, g, b) {
  return '#' + [r, g, b].map(x => pad(Math.round(x * 255).toString(16))).join('')
}
