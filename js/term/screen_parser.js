const $ = require('../lib/chibi')
const { qs } = require('../utils')

// constants for decoding the update blob
const SEQ_SKIP = 1
const SEQ_REPEAT = 2
const SEQ_SET_COLORS = 3
const SEQ_SET_ATTRS = 4
const SEQ_SET_FG = 5
const SEQ_SET_BG = 6
const SEQ_SET_ATTR_0 = 7

function du (str) {
  let num = str.codePointAt(0)
  if (num > 0xDFFF) num -= 0x800
  return num - 1
}

/* eslint-disable no-multi-spaces */
const TOPIC_SCREEN_OPTS  = 'O'
const TOPIC_CONTENT      = 'S'
const TOPIC_TITLE        = 'T'
const TOPIC_BUTTONS      = 'B'
const TOPIC_CURSOR       = 'C'
const TOPIC_INTERNAL     = 'D'
const TOPIC_BELL         = '!'

const OPT_CURSOR_VISIBLE   = (1 << 0)
const OPT_DEBUGBAR         = (1 << 1)
const OPT_CURSORS_ALT_MODE = (1 << 2)
const OPT_NUMPAD_ALT_MODE  = (1 << 3)
const OPT_FN_ALT_MODE      = (1 << 4)
const OPT_CLICK_TRACKING   = (1 << 5)
const OPT_MOVE_TRACKING    = (1 << 6)
const OPT_SHOW_BUTTONS     = (1 << 7)
const OPT_SHOW_CONFIG_LINKS = (1 << 8)
// const OPT_CURSOR_SHAPE   = (7 << 9)
const OPT_CRLF_MODE        = (1 << 12)
const OPT_BRACKETED_PASTE  = (1 << 13)
const OPT_REVERSE_VIDEO    = (1 << 14)

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

module.exports = class ScreenParser {
  constructor (screen) {
    this.screen = screen

    // true if TermScreen#load was called at least once
    this.contentLoaded = false
  }

  /**
   * Hide the warning message about failed data load
   */
  hideLoadFailedMsg () {
    if (!this.contentLoaded) {
      let errmsg = qs('#load-failed')
      if (errmsg) errmsg.parentNode.removeChild(errmsg)
      this.contentLoaded = true
    }
  }

  loadUpdate (str) {
    // console.log(`update ${str}`)
    // current index
    let ci = 0
    let strArray = Array.from ? Array.from(str) : str.split('')

    let text
    let resized = false
    const topics = du(strArray[ci++])
    // this.screen.cursor.hanging = !!(attributes & (1 << 1))

    while (ci < strArray.length) {
      const topic = strArray[ci++]

      if (topic === TOPIC_SCREEN_OPTS) {
        const newHeight = du(strArray[ci++])
        const newWidth = du(strArray[ci++])
        const theme = du(strArray[ci++])
        const defFg = (du(strArray[ci++]) & 0xFFFF) | ((du(strArray[ci++]) & 0xFFFF) << 16)
        const defBg = (du(strArray[ci++]) & 0xFFFF) | ((du(strArray[ci++]) & 0xFFFF) << 16)
        const attributes = du(strArray[ci++])

        // theming
        this.screen.renderer.loadTheme(theme)
        this.screen.renderer.setDefaultColors(defFg, defBg)

        // apply size
        resized = (this.screen.window.height !== newHeight) || (this.screen.window.width !== newWidth)
        this.screen.window.height = newHeight
        this.screen.window.width = newWidth

        // process attributes
        this.screen.cursor.visible = !!(attributes & OPT_CURSOR_VISIBLE)

        this.screen.input.setAlts(
          !!(attributes & OPT_CURSORS_ALT_MODE),
          !!(attributes & OPT_NUMPAD_ALT_MODE),
          !!(attributes & OPT_FN_ALT_MODE),
          !!(attributes & OPT_CRLF_MODE)
        )

        const trackMouseClicks = !!(attributes & OPT_CLICK_TRACKING)
        const trackMouseMovement = !!(attributes & OPT_MOVE_TRACKING)

        // 0 - Block blink     2 - Block steady (1 is unused)
        // 3 - Underline blink 4 - Underline steady
        // 5 - I-bar blink     6 - I-bar steady
        let cursorShape = (attributes >> 9) & 0x07
        // if it's not zero, decrement such that the two most significant bits
        // are the type and the least significant bit is the blink state
        if (cursorShape > 0) cursorShape--
        const cursorStyle = cursorShape >> 1
        const cursorBlinking = !(cursorShape & 1)
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

        const showButtons = !!(attributes & OPT_SHOW_BUTTONS)
        const showConfigLinks = !!(attributes & OPT_SHOW_CONFIG_LINKS)

        $('.x-term-conf-btn').toggleClass('hidden', !showConfigLinks)
        $('#action-buttons').toggleClass('hidden', !showButtons)

        this.screen.bracketedPaste = !!(attributes & OPT_BRACKETED_PASTE)
        this.screen.reverseVideo = !!(attributes & OPT_REVERSE_VIDEO)

        const debugbar = !!(attributes & OPT_DEBUGBAR)
        // TODO do something with debugbar

      } else if (topic === TOPIC_CURSOR) {

        // cursor position
        const cursorY = du(strArray[ci++])
        const cursorX = du(strArray[ci++])
        const hanging = du(strArray[ci++])

        const cursorMoved = (
          hanging !== this.screen.cursor.hanging ||
          cursorX !== this.screen.cursor.x ||
          cursorY !== this.screen.cursor.y)

        this.screen.cursor.x = cursorX
        this.screen.cursor.y = cursorY

        this.screen.cursor.hanging = !!hanging

        if (cursorMoved) {
          this.screen.renderer.resetCursorBlink()
          this.screen.emit('cursor-moved')
        }

        this.screen.renderer.scheduleDraw('cursor-moved')
      } else if (topic === TOPIC_TITLE) {

        // TODO optimize this
        text = ''
        while (ci < strArray.length) {
          let c = strArray[ci++]
          if (c !== '\x01') {
            text += c
          } else {
            break
          }
        }

        qs('#screen-title').textContent = text
        if (text.length === 0) text = 'Terminal'
        qs('title').textContent = `${text} :: ESPTerm`

      } else if (topic === TOPIC_BUTTONS) {
        const count = du(strArray[ci++])

        let labels = []
        for (let j = 0; j < count; j++) {
          text = ''
          while (ci < strArray.length) {
            let c = strArray[ci++]
            if (c === '\x01') break
            text += c
          }
          labels.push(text)
        }

        this.screen.emit('button-labels', labels)
      } else if (topic === TOPIC_BELL) {

        this.screen.beep()

      } else if (topic === TOPIC_INTERNAL) {
        // debug info

        const flags = du(strArray[ci++])
        const cursorAttrs = du(strArray[ci++])
        const regionStart = du(strArray[ci++])
        const regionEnd = du(strArray[ci++])
        const charsetGx = du(strArray[ci++])
        const charsetG0 = strArray[ci++]
        const charsetG1 = strArray[ci++]
        const freeHeap = du(strArray[ci++])
        const clientCount = du(strArray[ci++])

        this.screen.emit('internal', {
          flags,
          cursorAttrs,
          regionStart,
          regionEnd,
          charsetGx,
          charsetG0,
          charsetG1,
          freeHeap,
          clientCount
        })
      } else if (topic === TOPIC_CONTENT) {
        // set screen content

        const frameY = du(strArray[ci++])
        const frameX = du(strArray[ci++])
        const frameHeight = du(strArray[ci++])
        const frameWidth = du(strArray[ci++])

        // content
        let fg = 7
        let bg = 0
        let attrs = 0
        let cell = 0 // cell index
        let lastChar = ' '
        let frameLength = frameWidth * frameHeight
        let screenLength = this.screen.window.width * this.screen.window.height

        if (resized) {
          this.screen.updateSize()
          this.screen.blinkingCellCount = 0
          this.screen.screen = new Array(screenLength).fill(' ')
          this.screen.screenFG = new Array(screenLength).fill(' ')
          this.screen.screenBG = new Array(screenLength).fill(' ')
          this.screen.screenAttrs = new Array(screenLength).fill(0)
        }

        const MASK_LINE_ATTR = ATTR_UNDERLINE | ATTR_OVERLINE | ATTR_STRIKE
        const MASK_BLINK = ATTR_BLINK

        let pushCell = () => {
          // Remove blink attribute if it wouldn't have any effect
          let myAttrs = attrs
          let hasFG = attrs & ATTR_FG
          let hasBG = attrs & ATTR_BG
          let cellFG = fg
          let cellBG = bg

          // use 0,0 if no fg/bg. this is to match back-end implementation
          // and allow leaving out fg/bg setting for cells with none
          if (!hasFG) cellFG = 0
          if (!hasBG) cellBG = 0

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

          let cellXInFrame = cell % frameWidth
          let cellYInFrame = Math.floor(cell / frameWidth)
          let index = (frameY + cellYInFrame) * this.screen.window.width + frameX + cellXInFrame

          // 8 dark system colors turn bright when bold
          if ((myAttrs & ATTR_BOLD) && !(myAttrs & ATTR_FAINT) && hasFG && cellFG < 8) {
            cellFG += 8
          }

          this.screen.screen[index] = lastChar
          this.screen.screenFG[index] = cellFG
          this.screen.screenBG[index] = cellBG
          this.screen.screenAttrs[index] = myAttrs
        }

        while (ci < strArray.length && cell < frameLength) {
          let character = strArray[ci++]
          let charCode = character.codePointAt(0)

          let data, count
          switch (charCode) {
            case SEQ_REPEAT:
              count = du(strArray[ci++])
              for (let j = 0; j < count; j++) {
                pushCell()
                if (++cell > frameLength) break
              }
              break

            case SEQ_SKIP:
              cell += du(strArray[ci++])
              break

            case SEQ_SET_COLORS:
              data = du(strArray[ci++])
              fg = data & 0xFF
              bg = (data >> 8) & 0xFF
              break

            case SEQ_SET_ATTRS:
              data = du(strArray[ci++])
              attrs = data & 0xFFFF
              break

            case SEQ_SET_ATTR_0:
              attrs = 0
              break

            case SEQ_SET_FG:
              data = du(strArray[ci++])
              if (data & 0x10000) {
                data &= 0xFFF
                data |= (du(strArray[ci++]) & 0xFFF) << 12
                data += 256
              }
              fg = data
              break

            case SEQ_SET_BG:
              data = du(strArray[ci++])
              if (data & 0x10000) {
                data &= 0xFFF
                data |= (du(strArray[ci++]) & 0xFFF) << 12
                data += 256
              }
              bg = data
              break

            default:
              if (charCode < 32) character = '\ufffd'
              lastChar = character
              pushCell()
              cell++
          }
        }

        if (this.screen.window.debug) console.log(`Blinky cells: ${this.screen.blinkingCellCount}`)

        this.screen.renderer.scheduleDraw('load', 16)
        this.screen.conn.emit('load')

      }

      if ((topics & 0x3B) !== 0) this.hideLoadFailedMsg()
    }
  }

  /**
   * Loads a message from the server, and optionally a theme.
   * @param {string} str - the message
   */
  load (str) {
    const content = str.substr(1)

    // This is a good place for debugging the message
    // console.log(str)

    switch (str[0]) {
      case 'U':
        this.loadUpdate(content)
        break

      case 'G':
        this.screen.showNotification(content)
        break

      default:
        console.warn(`Bad data message type; ignoring.\n${JSON.stringify(str)}`)
    }
  }
}
