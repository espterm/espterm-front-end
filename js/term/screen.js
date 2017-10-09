const EventEmitter = require('events')
const { mk } = require('../utils')
const notify = require('../notif')
const ScreenParser = require('./screen_parser')
const ScreenLayout = require('./screen_layout')
const { ATTR_BLINK } = require('./screen_attr_bits')

/**
 * A terminal screen.
 */
module.exports = class TermScreen extends EventEmitter {
  constructor () {
    super()

    this.parser = new ScreenParser()
    this.layout = new ScreenLayout()

    // debug screen handle
    this._debug = null

    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } else {
      console.warn('No AudioContext!')
    }

    this._window = {
      width: 0,
      height: 0,
      // two bits. LSB: debug enabled by user, MSB: debug enabled by server
      debug: 0,
      statusScreen: null
    }

    // make writing to window update size and draw
    this.window = new Proxy(this._window, {
      set (target, key, value) {
        if (target[key] !== value) {
          target[key] = value
          self.updateLayout()
          self.renderScreen(`window:${key}=${value}`)
          self.emit(`update-window:${key}`, value)
        }
        return true
      }
    })

    this.on('update-window:debug', debug => { this.layout.window.debug = !!debug })

    this.cursor = {
      x: 0,
      y: 0,
      blinking: true,
      visible: true,
      hanging: false,
      style: 'block'
    }

    const self = this

    // current selection
    this.selection = {
      // when false, this will prevent selection in favor of mouse events,
      // though alt can be held to override it
      selectable: null,

      // selection start and end (x, y) tuples
      start: [0, 0],
      end: [0, 0],

      setSelectable (value) {
        if (value !== this.selectable) {
          this.selectable = self.layout.selectable = value
        }
      }
    }

    // mouse features
    this.mouseMode = { clicks: false, movement: false }

    this.showLinks = false
    this.showButtons = false
    this.title = ''

    this.bracketedPaste = false
    this.blinkingCellCount = 0
    this.reverseVideo = false

    this.screen = []
    this.screenFG = []
    this.screenBG = []
    this.screenAttrs = []

    let selecting = false

    let selectStart = (x, y) => {
      if (selecting) return
      selecting = true
      this.selection.start = this.selection.end = this.layout.screenToGrid(x, y, true)
      this.renderScreen('select-start')
    }

    let selectMove = (x, y) => {
      if (!selecting) return
      this.selection.end = this.layout.screenToGrid(x, y, true)
      this.renderScreen('select-move')
    }

    let selectEnd = (x, y) => {
      if (!selecting) return
      selecting = false
      this.selection.end = this.layout.screenToGrid(x, y, true)
      this.renderScreen('select-end')
      Object.assign(this.selection, this.getNormalizedSelection())
    }

    // bind event listeners

    this.layout.on('mousedown', e => {
      this.emit('hide-touch-select-menu')
      if ((this.selection.selectable || e.altKey) && e.button === 0) {
        selectStart(e.offsetX, e.offsetY)
      } else {
        this.emit('mousedown', ...this.layout.screenToGrid(e.offsetX, e.offsetY), e.button + 1)
      }
    })

    window.addEventListener('mousemove', e => {
      selectMove(e.offsetX, e.offsetY)
    })

    window.addEventListener('mouseup', e => {
      selectEnd(e.offsetX, e.offsetY)
    })

    // touch event listeners

    let touchPosition = null
    let touchDownTime = 0
    let touchSelectMinTime = 500
    let touchDidMove = false

    let getTouchPositionOffset = touch => {
      let rect = this.layout.canvas.getBoundingClientRect()
      return [touch.clientX - rect.left, touch.clientY - rect.top]
    }

    this.layout.on('touchstart', e => {
      touchPosition = getTouchPositionOffset(e.touches[0])
      touchDidMove = false
      touchDownTime = Date.now()
    })

    this.layout.on('touchmove', e => {
      touchPosition = getTouchPositionOffset(e.touches[0])

      if (!selecting && touchDidMove === false) {
        if (touchDownTime < Date.now() - touchSelectMinTime) {
          selectStart(...touchPosition)
        }
      } else if (selecting) {
        e.preventDefault()
        selectMove(...touchPosition)
      }

      touchDidMove = true
    })

    this.layout.on('touchend', e => {
      if (e.touches[0]) {
        touchPosition = getTouchPositionOffset(e.touches[0])
      }

      if (selecting) {
        e.preventDefault()
        selectEnd(...touchPosition)

        // selection ended; show touch select menu
        // use middle position for x and one line above for y
        let selectionPos = this.layout.gridToScreen(
          (this.selection.start[0] + this.selection.end[0]) / 2,
          this.selection.start[1] - 1
        )

        this.emit('show-touch-select-menu', selectionPos[0], selectionPos[1])
      }

      if (!touchDidMove && !this.mouseMode.clicks) {
        this.emit('tap', Object.assign(e, {
          x: touchPosition[0],
          y: touchPosition[1]
        }))
      }

      touchPosition = null
    })

    this.on('tap', e => {
      if (this.selection.start[0] !== this.selection.end[0] ||
        this.selection.start[1] !== this.selection.end[1]) {
        // selection is not empty
        // reset selection
        this.selection.start = this.selection.end = [0, 0]
        this.emit('hide-touch-select-menu')
        this.renderScreen('select-reset')
      } else {
        e.preventDefault()
        this.emit('open-soft-keyboard')
      }
    })

    this.layout.on('mousemove', e => {
      if (!selecting) {
        this.emit('mousemove', ...this.layout.screenToGrid(e.offsetX, e.offsetY))
      }
    })

    this.layout.on('mouseup', e => {
      if (!selecting) {
        this.emit('mouseup', ...this.layout.screenToGrid(e.offsetX, e.offsetY),
          e.button + 1)
      }
    })

    let aggregateWheelDelta = 0
    this.layout.on('wheel', e => {
      if (this.mouseMode.clicks) {
        if (Math.abs(e.wheelDeltaY) === 120) {
          // mouse wheel scrolling
          this.emit('mousewheel', ...this.layout.screenToGrid(e.offsetX, e.offsetY), e.deltaY > 0 ? 1 : -1)
        } else {
          // smooth scrolling
          aggregateWheelDelta -= e.wheelDeltaY
          if (Math.abs(aggregateWheelDelta) >= 40) {
            this.emit('mousewheel', ...this.layout.screenToGrid(e.offsetX, e.offsetY), aggregateWheelDelta > 0 ? 1 : -1)
            aggregateWheelDelta = 0
          }
        }

        // prevent page scrolling
        e.preventDefault()
      }
    })

    this.layout.on('contextmenu', e => {
      if (this.mouseMode.clicks) {
        // prevent mouse keys getting stuck
        e.preventDefault()
      }
      selectEnd(e.offsetX, e.offsetY)
    })
  }

  resetScreen () {
    const { width, height } = this.window
    this.blinkingCellCount = 0
    this.screen.screen = new Array(width * height).fill(' ')
    this.screen.screenFG = new Array(width * height).fill(0)
    this.screen.screenBG = new Array(width * height).fill(0)
    this.screen.screenAttrs = new Array(width * height).fill(0)
  }

  updateLayout () {
    this.layout.window.width = this.window.width
    this.layout.window.height = this.window.height
  }

  renderScreen (reason) {
    let selection = []

    for (let cell = 0; cell < this.screen.length; cell++) {
      selection.push(this.isInSelection(cell % this.window.width, Math.floor(cell / this.window.width)))
    }

    this.layout.render(reason, {
      width: this.window.width,
      height: this.window.height,
      screen: this.screen,
      screenFG: this.screenFG,
      screenBG: this.screenBG,
      screenSelection: selection,
      screenAttrs: this.screenAttrs,
      cursor: this.cursor,
      statusScreen: this.window.statusScreen,
      hasBlinkingCells: !!this.blinkingCellCount
    })
  }

  /**
   * Returns a normalized version of the current selection, such that `start`
   * is always before `end`.
   * @returns {Object} the normalized selection, with `start` and `end`
   */
  getNormalizedSelection () {
    let { start, end } = this.selection
    // if the start line is after the end line, or if they're both on the same
    // line but the start column comes after the end column, swap
    if (start[1] > end[1] || (start[1] === end[1] && start[0] > end[0])) {
      [start, end] = [end, start]
    }
    return { start, end }
  }

  /**
   * Returns whether or not a given cell is in the current selection.
   * @param {number} col - the column (x)
   * @param {number} line - the line (y)
   * @returns {boolean}
   */
  isInSelection (col, line) {
    let { start, end } = this.getNormalizedSelection()
    let colAfterStart = start[0] <= col
    let colBeforeEnd = col < end[0]
    let onStartLine = line === start[1]
    let onEndLine = line === end[1]

    if (onStartLine && onEndLine) return colAfterStart && colBeforeEnd
    else if (onStartLine) return colAfterStart
    else if (onEndLine) return colBeforeEnd
    else return start[1] < line && line < end[1]
  }

  /**
   * Sweeps for selected cells and joins them in a multiline string.
   * @returns {string} the selection
   */
  getSelectedText () {
    const screenLength = this.window.width * this.window.height
    let lines = []
    let previousLineIndex = -1

    for (let cell = 0; cell < screenLength; cell++) {
      let x = cell % this.window.width
      let y = Math.floor(cell / this.window.width)

      if (this.isInSelection(x, y)) {
        if (previousLineIndex !== y) {
          previousLineIndex = y
          lines.push('')
        }
        lines[lines.length - 1] += this.screen[cell]
      }
    }

    return lines.join('\n')
  }

  /**
   * Copies the selection to clipboard and creates a notification balloon.
   */
  copySelectionToClipboard () {
    let selectedText = this.getSelectedText()
    // don't copy anything if nothing is selected
    if (!selectedText) return
    let textarea = mk('textarea')
    document.body.appendChild(textarea)
    textarea.value = selectedText
    textarea.select()
    if (document.execCommand('copy')) {
      notify.show('Copied to clipboard')
    } else {
      notify.show('Failed to copy')
    }
    document.body.removeChild(textarea)
  }

  /**
   * Shows an actual notification (if possible) or a notification balloon.
   * @param {string} text - the notification content
   */
  showNotification (text) {
    console.info(`Notification: ${text}`)
    if (window.Notification && window.Notification.permission === 'granted') {
      let notification = new window.Notification('ESPTerm', {
        body: text
      })
      notification.addEventListener('click', () => window.focus())
    } else {
      if (window.Notification && window.Notification.permission !== 'denied') {
        window.Notification.requestPermission()
      } else {
        // Fallback using the built-in notification balloon
        notify.show(text)
      }
    }
  }

  /**
   * Creates a beep sound.
   */
  beep () {
    const audioCtx = this.audioCtx
    if (!audioCtx) return

    // prevent screeching
    if (this._lastBeep && this._lastBeep > Date.now() - 50) return
    this._lastBeep = Date.now()

    if (!this._convolver) {
      this._convolver = audioCtx.createConvolver()
      let impulseLength = audioCtx.sampleRate * 0.8
      let impulse = audioCtx.createBuffer(2, impulseLength, audioCtx.sampleRate)
      for (let i = 0; i < impulseLength; i++) {
        impulse.getChannelData(0)[i] = (1 - i / impulseLength) ** (7 + Math.random())
        impulse.getChannelData(1)[i] = (1 - i / impulseLength) ** (7 + Math.random())
      }
      this._convolver.buffer = impulse
      this._convolver.connect(audioCtx.destination)
    }

    // main beep
    const mainOsc = audioCtx.createOscillator()
    const mainGain = audioCtx.createGain()
    mainOsc.connect(mainGain)
    mainGain.gain.value = 4
    mainOsc.frequency.value = 750
    mainOsc.type = 'sine'

    // surrogate beep (making it sound like 'oops')
    const surrOsc = audioCtx.createOscillator()
    const surrGain = audioCtx.createGain()
    surrOsc.connect(surrGain)
    surrGain.gain.value = 2
    surrOsc.frequency.value = 400
    surrOsc.type = 'sine'

    mainGain.connect(this._convolver)
    surrGain.connect(this._convolver)

    let startTime = audioCtx.currentTime
    mainOsc.start()
    mainOsc.stop(startTime + 0.5)
    surrOsc.start(startTime + 0.05)
    surrOsc.stop(startTime + 0.8)

    let loop = function () {
      if (audioCtx.currentTime < startTime + 0.8) window.requestAnimationFrame(loop)
      mainGain.gain.value *= 0.8
      surrGain.gain.value *= 0.8
    }
    loop()
  }

  load (...args) {
    const updates = this.parser.parse(...args)

    for (let update of updates) {
      switch (update.topic) {
        case 'screen-opts':
          if (update.width !== this.window.width || update.height !== this.window.height) {
            this.window.width = update.width
            this.window.height = update.height
            this.resetScreen()
          }
          this.layout.renderer.loadTheme(update.theme)
          this.layout.renderer.setDefaultColors(update.defFG, update.defBG)
          this.cursor.visible = update.cursorVisible
          this.emit('input-alts', ...update.inputAlts)
          this.mouseMode.clicks = update.trackMouseClicks
          this.mouseMode.movement = update.trackMouseMovement
          this.emit('mouse-mode', update.trackMouseClicks, update.trackMouseMovement)
          this.selection.setSelectable(!update.trackMouseClicks && !update.trackMouseMovement)
          if (this.cursor.blinking !== update.cursorBlinking) {
            this.cursor.blinking = update.cursorBlinking
            this.layout.renderer.resetCursorBlink()
          }
          this.cursor.style = update.cursorStyle
          this.bracketedPaste = update.bracketedPaste
          this.reverseVideo = update.reverseVideo
          this.window.debug &= 0b01
          this.window.debug |= (+update.debugEnabled << 1)

          this.showLinks = update.showConfigLinks
          this.showButtons = update.showButtons
          this.emit('opts-update')
          break

        case 'cursor':
          if (this.cursor.x !== update.x || this.cursor.y !== update.y || this.cursor.hanging !== update.hanging) {
            this.cursor.x = update.x
            this.cursor.y = update.y
            this.cursor.hanging = update.hanging
            this.layout.renderer.resetCursorBlink()
            this.emit('cursor-moved')
            this.renderScreen('cursor-moved')
          }
          break

        case 'title':
          this.emit('title-update', this.title = update.title)
          break

        case 'button-labels':
          this.emit('button-labels', update.labels)
          break

        case 'backdrop':
          this.backgroundImage = update.image
          break

        case 'bell':
          this.beep()
          break

        case 'internal':
          this.emit('internal', update)
          break

        case 'content':
          const { frameX, frameY, frameWidth, frameHeight, cells } = update

          if (this._debug && this.window.debug) {
            this._debug.pushFrame([frameX, frameY, frameWidth, frameHeight])
          }

          for (let cell = 0; cell < cells.length; cell++) {
            let data = cells[cell]

            let cellXInFrame = cell % frameWidth
            let cellYInFrame = Math.floor(cell / frameWidth)
            let index = (frameY + cellYInFrame) * this.window.width + frameX + cellXInFrame

            if ((this.screenAttrs[index] & ATTR_BLINK) !== (data[3] & ATTR_BLINK)) {
              if (data[3] & ATTR_BLINK) this.blinkingCellCount++
              else this.blinkingCellCount--
            }

            this.screen[index] = data[0]
            this.screenFG[index] = data[1]
            this.screenBG[index] = data[2]
            this.screenAttrs[index] = data[3]
          }

          if (this.window.debug) console.log(`Blinking cells: ${this.blinkingCellCount}`)

          this.renderScreen('load')
          this.emit('load')
          break

        case 'full-load-complete':
          this.emit('full-load')
          break

        case 'notification':
          this.showNotification(update.content)
          break

        default:
          console.warn('Unhandled update', update)
      }
    }
  }
}
