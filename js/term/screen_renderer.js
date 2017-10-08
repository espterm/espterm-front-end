const {
  themes,
  buildColorTable,
  getColor
} = require('./themes')

const {
  ATTR_FG,
  ATTR_BG,
  ATTR_BOLD,
  ATTR_UNDERLINE,
  ATTR_INVERSE,
  ATTR_BLINK,
  ATTR_ITALIC,
  ATTR_STRIKE,
  ATTR_OVERLINE,
  ATTR_FAINT,
  ATTR_FRAKTUR
} = require('./screen_attr_bits')

// Some non-bold Fraktur symbols are outside the contiguous block
const frakturExceptions = {
  'C': '\u212d',
  'H': '\u210c',
  'I': '\u2111',
  'R': '\u211c',
  'Z': '\u2128'
}

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

      // full bg with default color (goes behind the image)
      this.screen.canvas.style.backgroundColor = this.getColor(bg)
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
    return getColor(i, this.palette)
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
   * @param {number} options.isDefaultBG - if true, will draw image background if available
   */
  drawBackground ({ x, y, cellWidth, cellHeight, bg, isDefaultBG }) {
    const ctx = this.ctx
    const { width, height } = this.screen.window
    const padding = Math.round(this.screen._padding)
    ctx.fillStyle = this.getColor(bg)
    let screenX = x * cellWidth + padding
    let screenY = y * cellHeight + padding
    let isBorderCell = x === 0 || y === 0 || x === width - 1 || y === height - 1

    let fillX, fillY, fillWidth, fillHeight
    if (isBorderCell) {
      let left = screenX
      let top = screenY
      let right = screenX + cellWidth
      let bottom = screenY + cellHeight
      if (x === 0) left -= padding
      else if (x === width - 1) right += padding
      if (y === 0) top -= padding
      else if (y === height - 1) bottom += padding

      fillX = left
      fillY = top
      fillWidth = right - left
      fillHeight = bottom - top
    } else {
      fillX = screenX
      fillY = screenY
      fillWidth = cellWidth
      fillHeight = cellHeight
    }

    ctx.clearRect(fillX, fillY, fillWidth, fillHeight)

    if (!isDefaultBG || bg < 0 || !this.backgroundImage) {
      ctx.fillRect(fillX, fillY, fillWidth, fillHeight)
    }
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
    if (codePoint >= 0x2580 && codePoint <= 0x259F) {
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

      let isDefaultBG = false

      if (!(attrs & ATTR_FG)) fg = this.defaultFgNum
      if (!(attrs & ATTR_BG)) {
        bg = this.defaultBgNum
        isDefaultBG = true
      }

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

      fontGroups.get(font).push({ cell, x, y, text, fg, bg, attrs, isCursor, inSelection, isDefaultBG })
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
        let { cell, x, y, text, bg, isDefaultBG } = data

        if (redrawMap.get(cell)) {
          this.drawBackground({ x, y, cellWidth, cellHeight, bg, isDefaultBG })

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
