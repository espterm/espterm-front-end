const {
  ATTR_FG,
  ATTR_BG,
  ATTR_BOLD,
  ATTR_UNDERLINE,
  ATTR_BLINK,
  ATTR_STRIKE,
  ATTR_OVERLINE,
  ATTR_FAINT
} = require('./screen_attr_bits')

// constants for decoding the update blob
const SEQ_SKIP = 1
const SEQ_REPEAT = 2
const SEQ_SET_COLORS = 3
const SEQ_SET_ATTRS = 4
const SEQ_SET_FG = 5
const SEQ_SET_BG = 6
const SEQ_SET_ATTR_0 = 7

function du (str) {
  if (!str) return NaN
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
const TOPIC_BACKDROP     = 'W'

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

/* eslint-enable no-multi-spaces */

module.exports = class ScreenParser {
  constructor () {
    // true if full content was loaded
    this.contentLoaded = false
  }

  parseUpdate (str) {
    // console.log(`update ${str}`)

    // current index
    let ci = 0
    let strArray = Array.from ? Array.from(str) : str.split('')

    let text
    const topics = du(strArray[ci++])

    let collectOneTerminatedString = () => {
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
      return text
    }

    const updates = []

    while (ci < strArray.length) {
      const topic = strArray[ci++]

      if (topic === TOPIC_SCREEN_OPTS) {
        const height = du(strArray[ci++])
        const width = du(strArray[ci++])
        const theme = du(strArray[ci++])
        const defFG = (du(strArray[ci++]) & 0xFFFF) | ((du(strArray[ci++]) & 0xFFFF) << 16)
        const defBG = (du(strArray[ci++]) & 0xFFFF) | ((du(strArray[ci++]) & 0xFFFF) << 16)

        // process attributes
        const attributes = du(strArray[ci++])

        const cursorVisible = !!(attributes & OPT_CURSOR_VISIBLE)

        // HACK: input alts are formatted as arguments for Input#setAlts
        const inputAlts = [
          !!(attributes & OPT_CURSORS_ALT_MODE),
          !!(attributes & OPT_NUMPAD_ALT_MODE),
          !!(attributes & OPT_FN_ALT_MODE),
          !!(attributes & OPT_CRLF_MODE)
        ]

        const trackMouseClicks = !!(attributes & OPT_CLICK_TRACKING)
        const trackMouseMovement = !!(attributes & OPT_MOVE_TRACKING)

        // 0 - Block blink     2 - Block steady (1 is unused)
        // 3 - Underline blink 4 - Underline steady
        // 5 - I-bar blink     6 - I-bar steady
        let cursorShape = (attributes >> 9) & 0x07
        // if it's not zero, decrement such that the two most significant bits
        // are the type and the least significant bit is the blink state
        if (cursorShape > 0) cursorShape--
        let cursorStyle = cursorShape >> 1
        const cursorBlinking = !(cursorShape & 1)
        if (cursorStyle === 0) cursorStyle = 'block'
        else if (cursorStyle === 1) cursorStyle = 'line'
        else cursorStyle = 'bar'

        const showButtons = !!(attributes & OPT_SHOW_BUTTONS)
        const showConfigLinks = !!(attributes & OPT_SHOW_CONFIG_LINKS)

        const bracketedPaste = !!(attributes & OPT_BRACKETED_PASTE)
        const reverseVideo = !!(attributes & OPT_REVERSE_VIDEO)

        const debugEnabled = !!(attributes & OPT_DEBUGBAR)

        updates.push({
          topic: 'screen-opts',
          width,
          height,
          theme,
          defFG,
          defBG,
          cursorVisible,
          cursorBlinking,
          cursorStyle,
          inputAlts,
          trackMouseClicks,
          trackMouseMovement,
          showButtons,
          showConfigLinks,
          bracketedPaste,
          reverseVideo,
          debugEnabled
        })
      } else if (topic === TOPIC_CURSOR) {
        // cursor position
        const y = du(strArray[ci++])
        const x = du(strArray[ci++])
        const hanging = !!du(strArray[ci++])

        updates.push({
          topic: 'cursor',
          x,
          y,
          hanging
        })
      } else if (topic === TOPIC_TITLE) {
        updates.push({ topic: 'title', title: collectOneTerminatedString() })
      } else if (topic === TOPIC_BUTTONS) {
        const count = du(strArray[ci++])

        let labels = []
        for (let j = 0; j < count; j++) {
          text = collectOneTerminatedString()
          labels.push(text)
        }

        updates.push({
          topic: 'button-labels',
          labels
        })
      } else if (topic === TOPIC_BACKDROP) {
        updates.push({ topic: 'backdrop', image: collectOneTerminatedString() })
      } else if (topic === TOPIC_BELL) {
        updates.push({ topic: 'bell' })
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

        updates.push({
          topic: 'internal',
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

        const MASK_LINE_ATTR = ATTR_UNDERLINE | ATTR_OVERLINE | ATTR_STRIKE
        const MASK_BLINK = ATTR_BLINK

        const cells = []

        let pushCell = () => {
          let hasFG = attrs & ATTR_FG
          let hasBG = attrs & ATTR_BG
          let cellFG = fg
          let cellBG = bg
          let cellAttrs = attrs

          // use 0,0 if no fg/bg. this is to match back-end implementation
          // and allow leaving out fg/bg setting for cells with none
          if (!hasFG) cellFG = 0
          if (!hasBG) cellBG = 0

          // Remove blink attribute if it wouldn't have any effect
          if ((cellAttrs & MASK_BLINK) &&
            ((lastChar === ' ' && ((cellAttrs & MASK_LINE_ATTR) === 0)) || // no line styles
              (fg === bg && hasFG && hasBG) // invisible text
            )
          ) {
            cellAttrs ^= MASK_BLINK
          }

          // 8 dark system colors turn bright when bold
          if ((cellAttrs & ATTR_BOLD) && !(cellAttrs & ATTR_FAINT) && hasFG && cellFG < 8) {
            cellFG += 8
          }

          cells.push([lastChar, cellFG, cellBG, cellAttrs])
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

        updates.push({
          topic: 'content',
          frameX,
          frameY,
          frameWidth,
          frameHeight,
          cells
        })
      }

      if (topics & 0x3B && !this.contentLoaded) {
        updates.push({ topic: 'full-load-complete' })
        this.contentLoaded = true
      }
    }

    return updates
  }

  /**
   * Parses a message from the server
   * @param {string} message - the message
   */
  parse (message) {
    const content = message.substr(1)
    const updates = []

    // This is a good place for debugging the message
    // console.log(message)

    switch (message[0]) {
      case 'U':
        updates.push(...this.parseUpdate(content))
        break

      case 'G':
        return [{
          topic: 'notification',
          content
        }]

      default:
        console.warn(`Bad data message type; ignoring.\n${JSON.stringify(message)}`)
    }

    return updates
  }
}
