const { themes, buildColorTable, SELECTION_FG, SELECTION_BG } = require('./themes')

// Some non-bold Fraktur symbols are outside the contiguous block
const frakturExceptions = {
  'C': '\u212d',
  'H': '\u210c',
  'I': '\u2111',
  'R': '\u211c',
  'Z': '\u2128'
}

// TODO do not repeat - this is also defined in screen_parser ...
/* eslint-disable no-multi-spaces */
const ATTR_FG        = (1 << 0)  // 1 if not using default background color (ignore cell bg) - color extension bit
const ATTR_BG        = (1 << 1)  // 1 if not using default foreground color (ignore cell fg) - color extension bit
const ATTR_BOLD      = (1 << 2)  // Bold font
const ATTR_UNDERLINE = (1 << 3)  // Underline decoration
const ATTR_INVERSE   = (1 << 4)  // Invert colors - this is useful so we can clear then with SGR manipulation commands
const ATTR_BLINK     = (1 << 5)  // Blinking
const ATTR_ITALIC    = (1 << 6)  // Italic font
const ATTR_STRIKE    = (1 << 7)  // Strike-through decoration
const ATTR_OVERLINE  = (1 << 8)  // Over-line decoration
const ATTR_FAINT     = (1 << 9)  // Faint foreground color (reduced alpha)
const ATTR_FRAKTUR   = (1 << 10) // Fraktur font (unicode substitution)
/* eslint-enable no-multi-spaces */

module.exports = class ScreenRenderer {
  constructor (screen) {
    this.screen = screen
    this.ctx = screen.ctx

    this._palette = null    // colors 0-15
    this.defaultBgNum = 0
    this.defaultFgNum = 7

    // 256color lookup table
    // should not be used to look up 0-15 (will return transparent)
    this.colorTable256 = buildColorTable()

    this.resetDrawn()

    this.blinkStyleOn = false
    this.blinkInterval = null
    this.cursorBlinkOn = false
    this.cursorBlinkInterval = null

    // start blink timers
    this.resetBlink()
    this.resetCursorBlink()
  }

  resetDrawn () {
    // used to determine if a cell should be redrawn; storing the current state
    // as it is on screen
    if (this.screen.window && this.screen.window.debug) {
      console.log('Resetting drawn screen')
    }
    this.drawnScreen = []
    this.drawnScreenFG = []
    this.drawnScreenBG = []
    this.drawnScreenAttrs = []
    this.drawnCursor = [-1, -1, '']
  }

  /**
   * The color palette. Should define 16 colors in an array.
   * @type {string[]}
   */
  get palette () {
    return this._palette || themes[0]
  }

  /** @type {string[]} */
  set palette (palette) {
    if (this._palette !== palette) {
      this._palette = palette
      this.resetDrawn()
      this.scheduleDraw('palette')
    }
  }

  loadTheme (i) {
    if (i in themes) this.palette = themes[i]
  }

  setDefaultColors (fg, bg) {
    if (fg !== this.defaultFgNum || bg !== this.defaultBgNum) {
      this.resetDrawn()
      this.defaultFgNum = fg
      this.defaultBgNum = bg
      this.scheduleDraw('default-colors')
    }
  }

  /**
   * Schedule a draw in the next millisecond
   * @param {string} why - the reason why the draw occured (for debugging)
   * @param {number} [aggregateTime] - time to wait for more scheduleDraw calls
   *   to occur. 1 ms by default.
   */
  scheduleDraw (why, aggregateTime = 1) {
    clearTimeout(this._scheduledDraw)
    this._scheduledDraw = setTimeout(() => this.draw(why), aggregateTime)
  }

  /**
   * Returns the specified color. If `i` is in the palette, it will return the
   * palette color. If `i` is between 16 and 255, it will return the 256color
   * value. If `i` is larger than 255, it will return an RGB color value. If `i`
   * is -1 (foreground) or -2 (background), it will return the selection colors.
   * @param {number} i - the color
   * @returns {string} the CSS color
   */
  getColor (i) {
    // return palette color if it exists
    if (i < 16 && i in this.palette) return this.palette[i]

    // -1 for selection foreground, -2 for selection background
    if (i === -1) return SELECTION_FG
    if (i === -2) return SELECTION_BG

    // 256 color
    if (i > 15 && i < 256) return this.colorTable256[i]

    // true color, encoded as (hex) + 256 (such that #000 == 256)
    if (i > 255) {
      i -= 256
      let red = (i >> 16) & 0xFF
      let green = (i >> 8) & 0xFF
      let blue = i & 0xFF
      return `rgb(${red}, ${green}, ${blue})`
    }

    // return error color
    return (Date.now() / 1000) % 2 === 0 ? '#f0f' : '#0f0'
  }

  /**
   * Resets the cursor blink to on and restarts the timer
   */
  resetCursorBlink () {
    this.cursorBlinkOn = true
    clearInterval(this.cursorBlinkInterval)
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorBlinkOn = this.screen.cursor.blinking
        ? !this.cursorBlinkOn
        : true
      if (this.screen.cursor.blinking) this.scheduleDraw('cursor-blink')
    }, 500)
  }

  /**
   * Resets the blink style to on and restarts the timer
   */
  resetBlink () {
    this.blinkStyleOn = true
    clearInterval(this.blinkInterval)
    let intervals = 0
    this.blinkInterval = setInterval(() => {
      if (this.screen.blinkingCellCount <= 0) return

      intervals++
      if (intervals >= 4 && this.blinkStyleOn) {
        this.blinkStyleOn = false
        intervals = 0
        this.scheduleDraw('blink-style')
      } else if (intervals >= 1 && !this.blinkStyleOn) {
        this.blinkStyleOn = true
        intervals = 0
        this.scheduleDraw('blink-style')
      }
    }, 200)
  }

  /**
   * Draws a cell's background with the given parameters.
   * @param {Object} options
   * @param {number} options.x - x in cells
   * @param {number} options.y - y in cells
   * @param {number} options.cellWidth - cell width in pixels
   * @param {number} options.cellHeight - cell height in pixels
   * @param {number} options.bg - the background color
   */
  drawBackground ({ x, y, cellWidth, cellHeight, bg }) {
    const ctx = this.ctx
    const { width, height } = this.screen.window
    const padding = Math.round(this.screen._padding)
    ctx.fillStyle = this.getColor(bg)
    let screenX = x * cellWidth + padding
    let screenY = y * cellHeight + padding
    let isBorderCell = x === 0 || y === 0 || x === width - 1 || y === height - 1
    if (isBorderCell) {
      let left = screenX
      let top = screenY
      let right = screenX + cellWidth
      let bottom = screenY + cellHeight
      if (x === 0) left -= padding
      else if (x === width - 1) right += padding
      if (y === 0) top -= padding
      else if (y === height - 1) bottom += padding
      ctx.clearRect(left, top, right - left, bottom - top)
      ctx.fillRect(left, top, right - left, bottom - top)
    } else {
      ctx.clearRect(screenX, screenY, cellWidth, cellHeight)
      ctx.fillRect(screenX, screenY, cellWidth, cellHeight)
    }
  }

  drawBoxLine (x, y, dx, dy, type, normalType) {
    const ctx = this.ctx

    let normalOffset = 0
    if (normalType === 1) {
      // thin
      normalOffset = 1 / 2
    } else if (normalType === 2) {
      // thick
      normalOffset = 3 / 2
    } else if (normalType === 3) {
      // double
      normalOffset = -1
    }

    if (type === 1 || type === 2) {
      // thin or thick line
      ctx.lineWidth = type === 2 ? 3 : 1
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(x - Math.sign(dx) * normalOffset, y - Math.sign(dy) * normalOffset)
      ctx.lineTo(x + dx, y + dy)
      ctx.stroke()
    } else if (type === 3) {
      // double-stroked line
      ctx.lineWidth = 1
      ctx.lineCap = 'butt'
      ctx.beginPath()
      let nx = ctx.lineWidth * Math.sign(dy) // normal x
      let ny = ctx.lineWidth * Math.sign(dx) // normal y
      ctx.moveTo(x + nx - Math.sign(dx) * normalOffset, y + ny - Math.sign(dy) * normalOffset)
      ctx.lineTo(x + dx + nx, y + dy + ny)
      ctx.moveTo(x - nx - Math.sign(dx) * normalOffset, y - ny - Math.sign(dy) * normalOffset)
      ctx.lineTo(x + dx - nx, y + dy - ny)
      ctx.stroke()
    }
  }

  drawBoxLines ({ x, y, cellWidth, cellHeight, up, left, right, down }) {
    let centerX = (x + 0.5) * cellWidth
    let centerY = (y + 0.5) * cellHeight

    let verticalType = Math.max(up, down)
    let horizontalType = Math.max(left, right)

    if (up) this.drawBoxLine(centerX, centerY, 0, -cellHeight / 2, up, horizontalType)
    if (left) this.drawBoxLine(centerX, centerY, -cellWidth / 2, 0, left, verticalType)
    if (right) this.drawBoxLine(centerX, centerY, cellWidth / 2, 0, right, verticalType)
    if (down) this.drawBoxLine(centerX, centerY, 0, cellHeight / 2, down, horizontalType)
  }

  /**
   * Draws a cell's character with the given parameters. Won't do anything if
   * text is an empty string.
   * @param {Object} options
   * @param {number} options.x - x in cells
   * @param {number} options.y - y in cells
   * @param {Object} options.charSize - the character size, an object with
   *   `width` and `height` in pixels
   * @param {number} options.cellWidth - cell width in pixels
   * @param {number} options.cellHeight - cell height in pixels
   * @param {string} options.text - the cell content
   * @param {number} options.fg - the foreground color
   * @param {number} options.attrs - the cell's attributes
   */
  drawCharacter ({ x, y, charSize, cellWidth, cellHeight, text, fg, attrs }) {
    if (!text) return

    const ctx = this.ctx
    const padding = Math.round(this.screen._padding)

    let underline = false
    let strike = false
    let overline = false
    if (attrs & ATTR_FAINT) ctx.globalAlpha = 0.5
    if (attrs & ATTR_UNDERLINE) underline = true
    if (attrs & ATTR_FRAKTUR) text = ScreenRenderer.alphaToFraktur(text)
    if (attrs & ATTR_STRIKE) strike = true
    if (attrs & ATTR_OVERLINE) overline = true

    ctx.fillStyle = this.getColor(fg)

    let screenX = x * cellWidth + padding
    let screenY = y * cellHeight + padding

    let codePoint = text.codePointAt(0)
    if (codePoint >= 0x2500 && codePoint <= 0x257F) {
      // box drawing
      //      0 1 2 3 4 5 6 7 8 9 a b c d e f
      // 250  ─ ━ │ ┃ ┄ ┅ ┆ ┇ ┈ ┉ ┊ ┋ ┌ ┍ ┎ ┏
      // 251  ┐ ┑ ┒ ┓ └ ┕ ┖ ┗ ┘ ┙ ┚ ┛ ├ ┝ ┞ ┟
      // 252  ┠ ┡ ┢ ┣ ┤ ┥ ┦ ┧ ┨ ┩ ┪ ┫ ┬ ┭ ┮ ┯
      // 253  ┰ ┱ ┲ ┳ ┴ ┵ ┶ ┷ ┸ ┹ ┺ ┻ ┼ ┽ ┾ ┿
      // 254  ╀ ╁ ╂ ╃ ╄ ╅ ╆ ╇ ╈ ╉ ╊ ╋ ╌ ╍ ╎ ╏
      // 255  ═ ║ ╒ ╓ ╔ ╕ ╖ ╗ ╘ ╙ ╚ ╛ ╜ ╝ ╞ ╟
      // 256  ╠ ╡ ╢ ╣ ╤ ╥ ╦ ╧ ╨ ╩ ╪ ╫ ╬ ╭ ╮ ╯
      // 257  ╰ ╱ ╲ ╳ ╴ ╵ ╶ ╷ ╸ ╹ ╺ ╻ ╼ ╽ ╾ ╿

      ctx.strokeStyle = ctx.fillStyle

      if (codePoint <= 0x250B || (codePoint >= 0x254C && codePoint <= 0x254F)) {
        // single long line

        // direction. 0 for horizontal, 1 for vertical
        let direction, thick, dashes
        if (codePoint <= 0x250B) {
          direction = Math.floor((codePoint - 0x2500) / 2) % 2
          thick = codePoint % 2 === 1
          dashes = codePoint < 0x2504 ? 0 : codePoint < 0x2508 ? 3 : 4
        } else {
          direction = (codePoint - 0x254C) < 3 ? 0 : 1
          thick = codePoint % 2 === 1
          dashes = 2
        }

        ctx.lineWidth = thick ? 3 : 1
        if (dashes) {
          let length = direction === 0 ? cellWidth : cellHeight
          ctx.setLineDash([(length / dashes) - 1, 1])
        }

        ctx.beginPath()
        if (direction === 0) {
          ctx.moveTo(x * cellWidth, (y + 0.5) * cellHeight)
          ctx.lineTo((x + 1) * cellWidth, (y + 0.5) * cellHeight)
        } else {
          ctx.moveTo((x + 0.5) * cellWidth, y * cellHeight)
          ctx.lineTo((x + 0.5) * cellWidth, (y + 1) * cellHeight)
        }
        ctx.stroke()
        if (dashes) ctx.setLineDash([])
      } else if (codePoint <= 0x251B) {
        // two lines

        // horizontal line direction
        let directionX = (codePoint - 0x250B - 1) % 8 < 4 ? 1 : -1
        // vertical line direction
        let directionY = codePoint < 0x2514 ? 1 : -1
        let typeX = (1 - (codePoint - 0x250B) % 2) + 1
        let typeY = Math.floor((codePoint - 0x250B - 1) / 2) % 2 + 1

        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          up: directionY === -1 ? typeY : 0,
          down: directionY === 1 ? typeY : 0,
          left: directionX === -1 ? typeX : 0,
          right: directionX === 1 ? typeX : 0
        })
      } else if (codePoint <= 0x253B) {
        // three lines

        // TODO: figure out the pattern
        let up = [1, 1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]
        let left = [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
        let right = [1, 2, 1, 1, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2]
        let down = [1, 1, 1, 2, 2, 1, 2, 2, 1, 1, 1, 2, 2, 1, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0]
        let index = codePoint - 0x251C

        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          up: up[index],
          left: left[index],
          right: right[index],
          down: down[index]
        })
      } else if (codePoint <= 0x254B) {
        // four lines
        let up = [1, 1, 1, 1, 2, 1, 2, 2, 2, 1, 1, 2, 1, 2, 2, 2]
        let left = [1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2]
        let right = [1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 2, 2, 2, 1, 2, 2]
        let down = [1, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 2, 2, 2, 2]
        let index = codePoint - 0x253C

        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          up: up[index],
          left: left[index],
          right: right[index],
          down: down[index]
        })
      } else if (codePoint <= 0x2551) {
        // double struck line
        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          up: codePoint === 0x2551 ? 3 : 0,
          down: codePoint === 0x2551 ? 3 : 0,
          left: codePoint === 0x2550 ? 3 : 0,
          right: codePoint === 0x2550 ? 3 : 0
        })
      } else if (codePoint <= 0x256C) {
        // double struck

        // TODO: figure out the pattern
        let up = [0, 0, 0, 0, 0, 0, 1, 3, 3, 1, 3, 3, 1, 3, 3, 1, 3, 3, 0, 0, 0, 1, 3, 3, 1, 3, 3]
        let left = [0, 0, 0, 3, 1, 3, 0, 0, 0, 3, 1, 3, 0, 0, 0, 3, 1, 3, 3, 1, 3, 3, 1, 3, 3, 1, 3]
        let right = [3, 1, 3, 0, 0, 0, 3, 1, 3, 0, 0, 0, 3, 1, 3, 0, 0, 0, 3, 1, 3, 3, 1, 3, 3, 1, 3]
        let down = [1, 3, 3, 1, 3, 3, 0, 0, 0, 0, 0, 0, 1, 3, 3, 1, 3, 3, 1, 3, 3, 0, 0, 0, 1, 3, 3]
        let index = codePoint - 0x2552

        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          up: up[index],
          left: left[index],
          right: right[index],
          down: down[index]
        })
      } else if (codePoint <= 0x2570) {
        // arcs
        let centerX = (x + 0.5) * cellWidth
        let centerY = (y + 0.5) * cellHeight
        let radius = Math.min(cellWidth, cellHeight) / 2

        let endX = (codePoint - 0x256D) % 3 === 0 ? 1 : -1
        let startY = (codePoint - 0x256D) < 2 ? 1 : -1

        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(centerX, centerY + startY * cellHeight / 2)
        ctx.arcTo(centerX, centerY, centerX + endX * radius, centerY, radius)
        ctx.lineTo(centerX + endX * cellWidth / 2, centerY)
        ctx.stroke()
      } else if (codePoint <= 0x2573) {
        // diagonals
        ctx.lineWidth = 1
        ctx.beginPath()
        if (codePoint === 0x2571 || codePoint === 0x2573) {
          // diagonal /
          ctx.moveTo(x * cellWidth, (y + 1) * cellHeight)
          ctx.lineTo((x + 1) * cellWidth, y * cellHeight)
        }
        if (codePoint === 0x2572 || codePoint === 0x2573) {
          // diagonal \
          ctx.moveTo(x * cellWidth, y * cellHeight)
          ctx.lineTo((x + 1) * cellWidth, (y + 1) * cellHeight)
        }
        ctx.stroke()
      } else if (codePoint <= 0x257B) {
        // single lines

        // 0: left, 1: up, 2: right, 3: down
        let direction = (codePoint - 0x2574) % 4
        let type = codePoint < 0x2578 ? 1 : 2

        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          left: direction === 0 ? type : 0,
          up: direction === 1 ? type : 0,
          right: direction === 2 ? type : 0,
          down: direction === 3 ? type : 0
        })
      } else {
        let index = codePoint - 0x257C
        this.drawBoxLines({
          x,
          y,
          cellWidth,
          cellHeight,
          left: index === 0 ? 1 : index === 2 ? 2 : 0,
          up: index === 1 ? 1 : index === 3 ? 2 : 0,
          right: index === 0 ? 2 : index === 2 ? 1 : 0,
          down: index === 1 ? 2 : index === 3 ? 1 : 0
        })
      }
    } else if (codePoint >= 0x2580 && codePoint <= 0x259F) {
      // block elements
      ctx.beginPath()
      const left = screenX
      const top = screenY
      const cw = cellWidth
      const ch = cellHeight
      const c2w = cellWidth / 2
      const c2h = cellHeight / 2

      // http://www.fileformat.info/info/unicode/block/block_elements/utf8test.htm
      //         0x00  0x01  0x02  0x03  0x04  0x05  0x06  0x07  0x08  0x09  0x0A  0x0B  0x0C  0x0D  0x0E  0x0F
      // 0x2580     ▀     ▁     ▂     ▃     ▄     ▅     ▆     ▇     █     ▉     ▊     ▋     ▌     ▍     ▎     ▏
      // 0x2590     ▐     ░     ▒     ▓     ▔     ▕     ▖     ▗     ▘     ▙     ▚     ▛     ▜     ▝     ▞     ▟

      if (codePoint === 0x2580) {
        // upper half block >▀<
        ctx.rect(left, top, cw, c2h)
      } else if (codePoint <= 0x2588) {
        // lower n eighth block (increasing) >▁< to >█<
        let offset = (1 - (codePoint - 0x2580) / 8) * ch
        ctx.rect(left, top + offset, cw, ch - offset)
      } else if (codePoint <= 0x258F) {
        // left n eighth block (decreasing) >▉< to >▏<
        let offset = (codePoint - 0x2588) / 8 * cw
        ctx.rect(left, top, cw - offset, ch)
      } else if (codePoint === 0x2590) {
        // right half block >▐<
        ctx.rect(left + c2w, top, c2w, ch)
      } else if (codePoint <= 0x2593) {
        // shading >░< >▒< >▓<

        // dot spacing by dividing cell size by a constant. This could be
        // reworked to always return a whole number, but that would require
        // prime factorization, and doing that without a loop would let you
        // take over the world, which is not within the scope of this project.
        let dotSpacingX, dotSpacingY, dotSize
        if (codePoint === 0x2591) {
          dotSpacingX = cw / 4
          dotSpacingY = ch / 10
          dotSize = 1
        } else if (codePoint === 0x2592) {
          dotSpacingX = cw / 6
          dotSpacingY = cw / 10
          dotSize = 1
        } else if (codePoint === 0x2593) {
          dotSpacingX = cw / 4
          dotSpacingY = cw / 7
          dotSize = 2
        }

        let alignRight = false
        for (let dy = 0; dy < ch; dy += dotSpacingY) {
          for (let dx = 0; dx < cw; dx += dotSpacingX) {
            // prevent overflow
            let dotSizeY = Math.min(dotSize, ch - dy)
            ctx.rect(left + (alignRight ? cw - dx - dotSize : dx), top + dy, dotSize, dotSizeY)
          }
          alignRight = !alignRight
        }
      } else if (codePoint === 0x2594) {
        // upper one eighth block >▔<
        ctx.rect(left, top, cw, ch / 8)
      } else if (codePoint === 0x2595) {
        // right one eighth block >▕<
        ctx.rect(left + (7 / 8) * cw, top, cw / 8, ch)
      } else if (codePoint === 0x2596) {
        // left bottom quadrant >▖<
        ctx.rect(left, top + c2h, c2w, c2h)
      } else if (codePoint === 0x2597) {
        // right bottom quadrant >▗<
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x2598) {
        // left top quadrant >▘<
        ctx.rect(left, top, c2w, c2h)
      } else if (codePoint === 0x2599) {
        // left chair >▙<
        ctx.rect(left, top, c2w, ch)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259A) {
        // quadrants lt rb >▚<
        ctx.rect(left, top, c2w, c2h)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259B) {
        // left chair upside down >▛<
        ctx.rect(left, top, c2w, ch)
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259C) {
        // right chair upside down >▜<
        ctx.rect(left, top, cw, c2h)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259D) {
        // right top quadrant >▝<
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259E) {
        // quadrants lb rt >▞<
        ctx.rect(left, top + c2h, c2w, c2h)
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259F) {
        // right chair upside down >▟<
        ctx.rect(left, top + c2h, c2w, c2h)
        ctx.rect(left + c2w, top, c2w, ch)
      }

      ctx.fill()
    } else if (codePoint >= 0xE0B0 && codePoint <= 0xE0B3) {
      // powerline symbols, except branch, line, and lock. Basically, just the triangles
      ctx.beginPath()

      if (codePoint === 0xE0B0 || codePoint === 0xE0B1) {
        // right-pointing triangle
        ctx.moveTo(screenX, screenY)
        ctx.lineTo(screenX + cellWidth, screenY + cellHeight / 2)
        ctx.lineTo(screenX, screenY + cellHeight)
      } else if (codePoint === 0xE0B2 || codePoint === 0xE0B3) {
        // left-pointing triangle
        ctx.moveTo(screenX + cellWidth, screenY)
        ctx.lineTo(screenX, screenY + cellHeight / 2)
        ctx.lineTo(screenX + cellWidth, screenY + cellHeight)
      }

      if (codePoint % 2 === 0) {
        // triangle
        ctx.fill()
      } else {
        // chevron
        ctx.strokeStyle = ctx.fillStyle
        ctx.stroke()
      }
    } else {
      // Draw other characters using the text renderer
      ctx.fillText(text, screenX + 0.5 * cellWidth, screenY + 0.5 * cellHeight)
    }

    // -- line drawing - a reference for a possible future rect/line implementation ---
    // http://www.fileformat.info/info/unicode/block/box_drawing/utf8test.htm
    //         0x00  0x01  0x02  0x03  0x04  0x05  0x06  0x07  0x08  0x09  0x0A  0x0B  0x0C  0x0D  0x0E  0x0F
    // 0x2500     ─     ━     │     ┃     ┄     ┅     ┆     ┇     ┈     ┉     ┊     ┋     ┌     ┍     ┎     ┏
    // 0x2510     ┐     ┑     ┒     ┓     └     ┕     ┖     ┗     ┘     ┙     ┚     ┛     ├     ┝     ┞     ┟
    // 0x2520     ┠     ┡     ┢     ┣     ┤     ┥     ┦     ┧     ┨     ┩     ┪     ┫     ┬     ┭     ┮     ┯
    // 0x2530     ┰     ┱     ┲     ┳     ┴     ┵     ┶     ┷     ┸     ┹     ┺     ┻     ┼     ┽     ┾     ┿
    // 0x2540     ╀     ╁     ╂     ╃     ╄     ╅     ╆     ╇     ╈     ╉     ╊     ╋     ╌     ╍     ╎     ╏
    // 0x2550     ═     ║     ╒     ╓     ╔     ╕     ╖     ╗     ╘     ╙     ╚     ╛     ╜     ╝     ╞     ╟
    // 0x2560     ╠     ╡     ╢     ╣     ╤     ╥     ╦     ╧     ╨     ╩     ╪     ╫     ╬     ╭     ╮     ╯
    // 0x2570     ╰     ╱     ╲     ╳     ╴     ╵     ╶     ╷     ╸     ╹     ╺     ╻     ╼     ╽     ╾     ╿

    if (underline || strike || overline) {
      ctx.strokeStyle = this.getColor(fg)
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.beginPath()

      if (underline) {
        let lineY = Math.round(screenY + charSize.height) + 0.5
        ctx.moveTo(screenX, lineY)
        ctx.lineTo(screenX + cellWidth, lineY)
      }

      if (strike) {
        let lineY = Math.round(screenY + 0.5 * cellHeight) + 0.5
        ctx.moveTo(screenX, lineY)
        ctx.lineTo(screenX + cellWidth, lineY)
      }

      if (overline) {
        let lineY = Math.round(screenY) + 0.5
        ctx.moveTo(screenX, lineY)
        ctx.lineTo(screenX + cellWidth, lineY)
      }

      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }

  /**
   * Returns all adjacent cell indices given a radius.
   * @param {number} cell - the center cell index
   * @param {number} [radius] - the radius. 1 by default
   * @returns {number[]} an array of cell indices
   */
  getAdjacentCells (cell, radius = 1) {
    const { width, height } = this.screen.window
    const screenLength = width * height

    let cells = []

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        if (x === 0 && y === 0) continue
        cells.push(cell + x + y * width)
      }
    }

    return cells.filter(cell => cell >= 0 && cell < screenLength)
  }

  /**
   * Updates the screen.
   * @param {string} why - the draw reason (for debugging)
   */
  draw (why) {
    const ctx = this.ctx
    const {
      width,
      height,
      devicePixelRatio,
      statusScreen
    } = this.screen.window

    if (statusScreen) {
      // draw status screen instead
      this.drawStatus(statusScreen)
      this.startDrawLoop()
      return
    } else this.stopDrawLoop()

    const charSize = this.screen.getCharSize()
    const { width: cellWidth, height: cellHeight } = this.screen.getCellSize()
    const screenLength = width * height

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

    if (this.screen.window.debug && this.screen._debug) this.screen._debug.drawStart(why)

    ctx.font = this.screen.getFont()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // bits in the attr value that affect the font
    const FONT_MASK = ATTR_BOLD | ATTR_ITALIC

    // Map of (attrs & FONT_MASK) -> Array of cell indices
    let fontGroups = new Map()

    // Map of (cell index) -> boolean, whether or not a cell has updated
    let updateMap = new Map()

    for (let cell = 0; cell < screenLength; cell++) {
      let x = cell % width
      let y = Math.floor(cell / width)
      let isCursor = this.cursorBlinkOn &&
        this.screen.cursor.x === x &&
        this.screen.cursor.y === y &&
        this.screen.cursor.visible

      let wasCursor = x === this.drawnCursor[0] && y === this.drawnCursor[1]

      let inSelection = this.screen.isInSelection(x, y)

      let text = this.screen.screen[cell]
      let fg = this.screen.screenFG[cell] | 0
      let bg = this.screen.screenBG[cell] | 0
      let attrs = this.screen.screenAttrs[cell] | 0

      if (!(attrs & ATTR_FG)) fg = this.defaultFgNum
      if (!(attrs & ATTR_BG)) bg = this.defaultBgNum

      if (attrs & ATTR_INVERSE) [fg, bg] = [bg, fg] // swap - reversed character colors
      if (this.screen.reverseVideo) [fg, bg] = [bg, fg] // swap - reversed all screen

      if (attrs & ATTR_BLINK && !this.blinkStyleOn) {
        // blinking is enabled and blink style is off
        // set text to nothing so drawCharacter doesn't draw anything
        text = ''
      }

      if (inSelection) {
        fg = -1
        bg = -2
      }

      let didUpdate = text !== this.drawnScreen[cell] || // text updated
        fg !== this.drawnScreenFG[cell] || // foreground updated, and this cell has text
        bg !== this.drawnScreenBG[cell] || // background updated
        attrs !== this.drawnScreenAttrs[cell] || // attributes updated
        isCursor !== wasCursor || // cursor blink/position updated
        (isCursor && this.screen.cursor.style !== this.drawnCursor[2]) || // cursor style updated
        (isCursor && this.screen.cursor.hanging !== this.drawnCursor[3]) // cursor hanging updated

      let font = attrs & FONT_MASK
      if (!fontGroups.has(font)) fontGroups.set(font, [])

      fontGroups.get(font).push({ cell, x, y, text, fg, bg, attrs, isCursor, inSelection })
      updateMap.set(cell, didUpdate)
    }

    // Map of (cell index) -> boolean, whether or not a cell should be redrawn
    const redrawMap = new Map()

    let isTextWide = text =>
      text !== ' ' && ctx.measureText(text).width >= (cellWidth + 0.05)

    // decide for each cell if it should be redrawn
    let updateRedrawMapAt = cell => {
      let shouldUpdate = updateMap.get(cell) || redrawMap.get(cell) || false

      // TODO: fonts (necessary?)
      let text = this.screen.screen[cell]
      let isWideCell = isTextWide(text)
      let checkRadius = isWideCell ? 2 : 1

      if (!shouldUpdate) {
        // check adjacent cells
        let adjacentDidUpdate = false

        for (let adjacentCell of this.getAdjacentCells(cell, checkRadius)) {
          // update this cell if:
          // - the adjacent cell updated (For now, this'll always be true because characters can be slightly larger than they say they are)
          // - the adjacent cell updated and this cell or the adjacent cell is wide
          if (updateMap.get(adjacentCell) && (this.screen.window.graphics < 2 || isWideCell || isTextWide(this.screen.screen[adjacentCell]))) {
            adjacentDidUpdate = true
            break
          }
        }

        if (adjacentDidUpdate) shouldUpdate = true
      }

      redrawMap.set(cell, shouldUpdate)
    }

    for (let cell of updateMap.keys()) updateRedrawMapAt(cell)

    // mask to redrawing regions only
    if (this.screen.window.graphics >= 1) {
      let debug = this.screen.window.debug && this.screen._debug
      let padding = Math.round(this.screen._padding)
      ctx.save()
      ctx.beginPath()
      for (let y = 0; y < height; y++) {
        let regionStart = null
        for (let x = 0; x < width; x++) {
          let cell = y * width + x
          let redrawing = redrawMap.get(cell)
          if (redrawing && regionStart === null) regionStart = x
          if (!redrawing && regionStart !== null) {
            ctx.rect(padding + regionStart * cellWidth, padding + y * cellHeight, (x - regionStart) * cellWidth, cellHeight)
            if (debug) this.screen._debug.clipRect(regionStart * cellWidth, y * cellHeight, (x - regionStart) * cellWidth, cellHeight)
            regionStart = null
          }
        }
        if (regionStart !== null) {
          ctx.rect(padding + regionStart * cellWidth, padding + y * cellHeight, (width - regionStart) * cellWidth, cellHeight)
          if (debug) this.screen._debug.clipRect(regionStart * cellWidth, y * cellHeight, (width - regionStart) * cellWidth, cellHeight)
        }
      }
      ctx.clip()
    }

    // pass 1: backgrounds
    for (let font of fontGroups.keys()) {
      for (let data of fontGroups.get(font)) {
        let { cell, x, y, text, bg } = data

        if (redrawMap.get(cell)) {
          this.drawBackground({ x, y, cellWidth, cellHeight, bg })

          if (this.screen.window.debug && this.screen._debug) {
            // set cell flags
            let flags = (+redrawMap.get(cell))
            flags |= (+updateMap.get(cell)) << 1
            flags |= (+isTextWide(text)) << 2
            this.screen._debug.setCell(cell, flags)
          }
        }
      }
    }

    // reset drawn cursor
    this.drawnCursor = [-1, -1, -1]

    // pass 2: characters
    for (let font of fontGroups.keys()) {
      // set font once because in Firefox, this is a really slow action for some
      // reason
      let modifiers = {}
      if (font & ATTR_BOLD) modifiers.weight = 'bold'
      if (font & ATTR_ITALIC) modifiers.style = 'italic'
      ctx.font = this.screen.getFont(modifiers)

      for (let data of fontGroups.get(font)) {
        let { cell, x, y, text, fg, bg, attrs, isCursor, inSelection } = data

        if (redrawMap.get(cell)) {
          this.drawCharacter({
            x, y, charSize, cellWidth, cellHeight, text, fg, attrs
          })

          this.drawnScreen[cell] = text
          this.drawnScreenFG[cell] = fg
          this.drawnScreenBG[cell] = bg
          this.drawnScreenAttrs[cell] = attrs

          if (isCursor) this.drawnCursor = [x, y, this.screen.cursor.style, this.screen.cursor.hanging]

          // draw cursor
          if (isCursor && !inSelection) {
            ctx.save()
            ctx.beginPath()

            let cursorX = x
            let cursorY = y

            if (this.screen.cursor.hanging) {
              // draw hanging cursor in the margin
              cursorX += 1
            }

            let screenX = cursorX * cellWidth + this.screen._padding
            let screenY = cursorY * cellHeight + this.screen._padding
            if (this.screen.cursor.style === 'block') {
              // block
              ctx.rect(screenX, screenY, cellWidth, cellHeight)
            } else if (this.screen.cursor.style === 'bar') {
              // vertical bar
              let barWidth = 2
              ctx.rect(screenX, screenY, barWidth, cellHeight)
            } else if (this.screen.cursor.style === 'line') {
              // underline
              let lineHeight = 2
              ctx.rect(screenX, screenY + charSize.height, cellWidth, lineHeight)
            }
            ctx.clip()

            // swap foreground/background
            ;[fg, bg] = [bg, fg]

            // HACK: ensure cursor is visible
            if (fg === bg) bg = fg === 0 ? 7 : 0

            this.drawBackground({ x: cursorX, y: cursorY, cellWidth, cellHeight, bg })
            this.drawCharacter({
              x: cursorX, y: cursorY, charSize, cellWidth, cellHeight, text, fg, attrs
            })
            ctx.restore()
          }
        }
      }
    }

    if (this.screen.window.graphics >= 1) ctx.restore()

    if (this.screen.window.debug && this.screen._debug) this.screen._debug.drawEnd()

    this.screen.emit('draw', why)
  }

  drawStatus (statusScreen) {
    const ctx = this.ctx
    const {
      fontFamily,
      width,
      height,
      devicePixelRatio
    } = this.screen.window

    // reset drawnScreen to force redraw when statusScreen is disabled
    this.drawnScreen = []

    const cellSize = this.screen.getCellSize()
    const screenWidth = width * cellSize.width + 2 * this.screen._padding
    const screenHeight = height * cellSize.height + 2 * this.screen._padding

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.fillStyle = this.getColor(this.defaultBgNum)
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    ctx.font = `24px ${fontFamily}`
    ctx.fillStyle = this.getColor(this.defaultFgNum)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(statusScreen.title || '', screenWidth / 2, screenHeight / 2 - 50)

    if (statusScreen.loading) {
      // show loading spinner
      ctx.save()
      ctx.translate(screenWidth / 2, screenHeight / 2 + 20)

      ctx.strokeStyle = this.getColor(this.defaultFgNum)
      ctx.lineWidth = 5
      ctx.lineCap = 'round'

      let t = Date.now() / 1000

      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6)
        let offset = ((t * 12) - i) % 12
        ctx.globalAlpha = Math.max(0.2, 1 - offset / 3)
        ctx.beginPath()
        ctx.moveTo(0, 15)
        ctx.lineTo(0, 30)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  startDrawLoop () {
    if (this._drawTimerThread) return
    let threadID = Math.random().toString(36)
    this._drawTimerThread = threadID
    this.drawTimerLoop(threadID)
  }

  stopDrawLoop () {
    this._drawTimerThread = null
  }

  drawTimerLoop (threadID) {
    if (!threadID || threadID !== this._drawTimerThread) return
    window.requestAnimationFrame(() => this.drawTimerLoop(threadID))
    this.draw('draw-loop')
  }

  /**
   * Converts an alphabetic character to its fraktur variant.
   * @param {string} character - the character
   * @returns {string} the converted character
   */
  static alphaToFraktur (character) {
    if (character >= 'a' && character <= 'z') {
      character = String.fromCodePoint(0x1d51e - 0x61 + character.charCodeAt(0))
    } else if (character >= 'A' && character <= 'Z') {
      character = frakturExceptions[character] || String.fromCodePoint(0x1d504 - 0x41 + character.charCodeAt(0))
    }
    return character
  }
}
