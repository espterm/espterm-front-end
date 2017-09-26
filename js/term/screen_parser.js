const $ = require('../lib/chibi')
const { qs } = require('../utils')
const { themes } = require('./themes')

// constants for decoding the update blob
const SEQ_REPEAT = 2
const SEQ_SET_COLORS = 3
const SEQ_SET_ATTRS = 4
const SEQ_SET_FG = 5
const SEQ_SET_BG = 6

module.exports = class ScreenParser {
  constructor (screen) {
    this.screen = screen

    // true if TermScreen#load was called at least once
    this.contentLoaded = false
  }
  /**
   * Parses the content of an `S` message and schedules a draw
   * @param {string} str - the message content
   */
  loadContent (str) {
    // current index
    let i = 0
    let strArray = Array.from ? Array.from(str) : str.split('')

    // Uncomment to capture screen content for the demo page
    // console.log(JSON.stringify(`S${str}`))

    if (!this.contentLoaded) {
      let errmsg = qs('#load-failed')
      if (errmsg) errmsg.parentNode.removeChild(errmsg)
      this.contentLoaded = true
    }

    // window size
    const newHeight = strArray[i++].codePointAt(0) - 1
    const newWidth = strArray[i++].codePointAt(0) - 1
    const resized = (this.screen.window.height !== newHeight) || (this.screen.window.width !== newWidth)
    this.screen.window.height = newHeight
    this.screen.window.width = newWidth

    // cursor position
    let [cursorY, cursorX] = [
      strArray[i++].codePointAt(0) - 1,
      strArray[i++].codePointAt(0) - 1
    ]
    let cursorMoved = (cursorX !== this.screen.cursor.x || cursorY !== this.screen.cursor.y)
    this.screen.cursor.x = cursorX
    this.screen.cursor.y = cursorY

    if (cursorMoved) {
      this.screen.renderer.resetCursorBlink()
      this.screen.emit('cursor-moved')
    }

    // attributes
    let attributes = strArray[i++].codePointAt(0) - 1

    this.screen.cursor.visible = !!(attributes & 1)
    this.screen.cursor.hanging = !!(attributes & (1 << 1))

    this.screen.input.setAlts(
      !!(attributes & (1 << 2)), // cursors alt
      !!(attributes & (1 << 3)), // numpad alt
      !!(attributes & (1 << 4)), // fn keys alt
      !!(attributes & (1 << 12)) // crlf mode
    )

    let trackMouseClicks = !!(attributes & (1 << 5))
    let trackMouseMovement = !!(attributes & (1 << 6))

    // 0 - Block blink     2 - Block steady (1 is unused)
    // 3 - Underline blink 4 - Underline steady
    // 5 - I-bar blink     6 - I-bar steady
    let cursorShape = (attributes >> 9) & 0x07

    // if it's not zero, decrement such that the two most significant bits
    // are the type and the least significant bit is the blink state
    if (cursorShape > 0) cursorShape--

    let cursorStyle = cursorShape >> 1
    let cursorBlinking = !(cursorShape & 1)

    if (cursorStyle === 0) this.screen.cursor.style = 'block'
    else if (cursorStyle === 1) this.screen.cursor.style = 'line'
    else if (cursorStyle === 2) this.screen.cursor.style = 'bar'

    if (this.screen.cursor.blinking !== cursorBlinking) {
      this.screen.cursor.blinking = cursorBlinking
      this.screen.renderer.resetCursorBlink()
    }

    this.screen.input.setMouseMode(trackMouseClicks, trackMouseMovement)
    this.screen.selection.selectable = !trackMouseClicks && !trackMouseMovement
    $(this.screen.canvas).toggleClass('selectable', this.screen.selection.selectable)
    this.screen.mouseMode = {
      clicks: trackMouseClicks,
      movement: trackMouseMovement
    }

    let showButtons = !!(attributes & (1 << 7))
    let showConfigLinks = !!(attributes & (1 << 8))

    $('.x-term-conf-btn').toggleClass('hidden', !showConfigLinks)
    $('#action-buttons').toggleClass('hidden', !showButtons)

    this.screen.bracketedPaste = !!(attributes & (1 << 13))
    this.screen.reverseVideo = !!(attributes & (1 << 14))

    // content
    let fg = 7
    let bg = 0
    let attrs = 0
    let cell = 0 // cell index
    let lastChar = ' '
    let screenLength = this.screen.window.width * this.screen.window.height

    if (resized) {
      this.screen.updateSize()
      this.screen.blinkingCellCount = 0
      this.screen.screen = new Array(screenLength).fill(' ')
      this.screen.screenFG = new Array(screenLength).fill(' ')
      this.screen.screenBG = new Array(screenLength).fill(' ')
      this.screen.screenAttrs = new Array(screenLength).fill(0)
    }

    const MASK_LINE_ATTR = 0xC8
    const MASK_BLINK = 1 << 4

    let setCellContent = () => {
      // Remove blink attribute if it wouldn't have any effect
      let myAttrs = attrs
      let hasFG = attrs & (1 << 8)
      let hasBG = attrs & (1 << 9)
      if ((myAttrs & MASK_BLINK) !== 0 &&
        ((lastChar === ' ' && ((myAttrs & MASK_LINE_ATTR) === 0)) || // no line styles
          (fg === bg && hasFG && hasBG) // invisible text
        )
      ) {
        myAttrs ^= MASK_BLINK
      }
      // update blinking cells counter if blink state changed
      if ((this.screen.screenAttrs[cell] & MASK_BLINK) !== (myAttrs & MASK_BLINK)) {
        if (myAttrs & MASK_BLINK) this.screen.blinkingCellCount++
        else this.screen.blinkingCellCount--
      }

      this.screen.screen[cell] = lastChar
      this.screen.screenFG[cell] = fg
      this.screen.screenBG[cell] = bg
      this.screen.screenAttrs[cell] = myAttrs
    }

    while (i < strArray.length && cell < screenLength) {
      let character = strArray[i++]
      let charCode = character.codePointAt(0)

      let data
      switch (charCode) {
        case SEQ_REPEAT:
          let count = strArray[i++].codePointAt(0) - 1
          for (let j = 0; j < count; j++) {
            setCellContent()
            if (++cell > screenLength) break
          }
          break

        case SEQ_SET_COLORS:
          data = strArray[i++].codePointAt(0) - 1
          fg = data & 0xFF
          bg = (data >> 8) & 0xFF
          break

        case SEQ_SET_ATTRS:
          data = strArray[i++].codePointAt(0) - 1
          attrs = data & 0xFFFF
          break

        case SEQ_SET_FG:
          data = strArray[i++].codePointAt(0) - 1
          fg = data & 0xFF
          break

        case SEQ_SET_BG:
          data = strArray[i++].codePointAt(0) - 1
          bg = data & 0xFF
          break

        default:
          if (charCode < 32) character = '\ufffd'
          lastChar = character
          setCellContent()
          cell++
      }
    }

    if (this.screen.window.debug) console.log(`Blinky cells: ${this.screen.blinkingCellCount}`)

    this.screen.renderer.scheduleDraw('load', 16)
    this.screen.emit('load')
  }

  /**
   * Parses the content of a `T` message and updates the screen title and button
   * labels.
   * @param {string} str - the message content
   */
  loadLabels (str) {
    let pieces = str.split('\x01')
    let screenTitle = pieces[0]
    qs('#screen-title').textContent = screenTitle
    if (screenTitle.length === 0) screenTitle = 'Terminal'
    qs('title').textContent = `${screenTitle} :: ESPTerm`
    $('#action-buttons button').forEach((button, i) => {
      let label = pieces[i + 1].trim()
      // if empty string, use the "dim" effect and put nbsp instead to
      // stretch the button vertically
      button.innerHTML = label ? $.htmlEscape(label) : '&nbsp;'
      button.style.opacity = label ? 1 : 0.2
    })
  }

  /**
   * Loads a message from the server, and optionally a theme.
   * @param {string} str - the message
   * @param {object} [opts] - options
   * @param {number} [opts.theme] - theme
   * @param {number} [opts.defaultFg] - default foreground
   * @param {number} [opts.defaultBg] - default background
   */
  load (str, opts = null) {
    const content = str.substr(1)

    if (opts) {
      if (typeof opts.defaultFg !== 'undefined' && typeof opts.defaultBg !== 'undefined') {
        this.screen.renderer.setDefaultColors(opts.defaultFg, opts.defaultBg)
      }

      if (typeof opts.theme !== 'undefined') {
        if (opts.theme >= 0 && opts.theme < themes.length) {
          this.screen.renderer.palette = themes[opts.theme]
        }
      }
    }

    switch (str[0]) {
      case 'S':
        this.loadContent(content)
        break

      case 'T':
        this.loadLabels(content)
        break

      case 'B':
        this.screen.beep()
        break

      case 'G':
        this.screen.showNotification(content)
        break

      default:
        console.warn(`Bad data message type; ignoring.\n${JSON.stringify(str)}`)
    }
  }
}
