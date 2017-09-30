const $ = require('../lib/chibi')
const { rgb255_to_hex } = require('../lib/color_utils')

const themes = exports.themes = [
  [ // 0 - Tango - terminator
    '#111213', '#CC0000', '#4E9A06', '#C4A000', '#3465A4', '#75507B', '#06989A', '#D3D7CF',
    '#555753', '#EF2929', '#8AE234', '#FCE94F', '#729FCF', '#AD7FA8', '#34E2E2', '#EEEEEC'
  ],
  [ // 1 - Linux (CGA) - terminator
    '#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
    '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff'
  ],
  [ // 2 - xterm - terminator
    '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
    '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff'
  ],
  [ // 3 - rxvt - terminator
    '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000cd', '#cd00cd', '#00cdcd', '#faebd7',
    '#404040', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'
  ],
  [ // 4 - Ambience - terminator
    '#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf',
    '#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'
  ],
  [ // 5 - Solarized Dark - terminator
    '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
    '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4', '#93a1a1', '#fdf6e3'
  ],
  [ // 6 - CGA NTSC - wikipedia
    '#000000', '#69001A', '#117800', '#769100', '#1A00A6', '#8019AB', '#289E76', '#A4A4A4',
    '#484848', '#C54E76', '#6DD441', '#D2ED46', '#765BFF', '#DC75FF', '#84FAD2', '#FFFFFF'
  ],
  [ // 7 - ZX Spectrum - wikipedia
    '#000000', '#aa0000', '#00aa00', '#aaaa00', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
    '#000000', '#ff0000', '#00FF00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'
  ],
  [ // 8 - Apple II - wikipedia
    '#000000', '#722640', '#0E5940', '#808080', '#40337F', '#E434FE', '#1B9AFE', '#BFB3FF',
    '#404C00', '#E46501', '#1BCB01', '#BFCC80', '#808080', '#F1A6BF', '#8DD9BF', '#ffffff'
  ],
  [ // 9 - Commodore - wikipedia
    '#000000', '#8D3E37', '#55A049', '#AAB95D', '#40318D', '#80348B', '#72C1C8', '#D59F74',
    '#8B5429', '#B86962', '#94E089', '#FFFFB2', '#8071CC', '#AA5FB6', '#87D6DD', '#ffffff'
  ],
  [ // 10 - Solarized Light - https://github.com/sgerrand/xfce4-terminal-colors-solarized
    '#eee8d5', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#073642',
    '#fdf6e3', '#cb4b16', '#93a1a1', '#839496', '#657b83', '#6c71c4', '#586e75', '#002b36'
  ],
  [ // 11 - Solarized Dark High contrast - https://github.com/sgerrand/xfce4-terminal-colors-solarized
    '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#fdf6e3',
    '#002b36', '#cb4b16', '#657b83', '#839496', '#93a1a1', '#6c71c4', '#eee8d5', '#fdf6e3'
  ]
]

exports.fgbgThemes = [
  ['#AAAAAA', '#000000', 'Lnx', 'Linux'],
  ['#FFFFFF', '#000000', 'W+K', 'White on Black'],
  ['#00FF00', '#000000', 'Lim', 'Lime'],
  ['#E53C00', '#000000', 'Nix', 'Nixie'],
  ['#EFF0F1', '#31363B', 'Brz', 'Breeze'],
  ['#FFFFFF', '#300A24', 'Amb', 'Ambiance'],
  ['#839496', '#002B36', 'SoD', 'Solarized Dark'],
  ['#93a1a1', '#002b36', 'SoH', 'Solarized Dark (High Contrast)'],
  ['#657B83', '#FDF6E3', 'SoL', 'Solarized Light'],
  ['#000000', '#FFD75F', 'Wsp', 'Wasp'],
  ['#000000', '#FFFFDD', 'K+Y', 'Black on Yellow'],
  ['#000000', '#FFFFFF', 'K+W', 'Black on White']
]

let colorTable256 = null

exports.buildColorTable = function () {
  if (colorTable256 !== null) return colorTable256

  // 256color lookup table
  // should not be used to look up 0-15 (will return transparent)
  colorTable256 = new Array(16).fill('#000000')

  // fill color table
  // colors 16-231 are a 6x6x6 color cube
  for (let red = 0; red < 6; red++) {
    for (let green = 0; green < 6; green++) {
      for (let blue = 0; blue < 6; blue++) {
        let redValue = red * 40 + (red ? 55 : 0)
        let greenValue = green * 40 + (green ? 55 : 0)
        let blueValue = blue * 40 + (blue ? 55 : 0)
        colorTable256.push(rgb255_to_hex(redValue, greenValue, blueValue))
      }
    }
  }
  // colors 232-255 are a grayscale ramp, sans black and white
  for (let gray = 0; gray < 24; gray++) {
    let value = gray * 10 + 8
    colorTable256.push(rgb255_to_hex(value, value, value))
  }

  return colorTable256
}

exports.SELECTION_FG = '#333'
exports.SELECTION_BG = '#b2d7fe'

exports.themePreview = function (themeN) {
  $('[data-fg]').forEach((elem) => {
    let shade = elem.dataset.fg
    if (/^\d+$/.test(shade)) shade = exports.toHex(shade, themeN)
    elem.style.color = shade
  })
  $('[data-bg]').forEach((elem) => {
    let shade = elem.dataset.bg
    if (/^\d+$/.test(shade)) shade = exports.toHex(shade, themeN)
    elem.style.backgroundColor = shade
  })
}

exports.toHex = function (shade, themeN) {
  if (/^\d+$/.test(shade)) {
    shade = +shade
    if (shade < 16) shade = themes[themeN][shade]
    else {
      shade = exports.buildColorTable()[shade]
    }
  }
  return shade
}
