const EventEmitter = require('events')
const $ = require('../lib/chibi')
const { mk, qs } = require('../utils')
const notify = require('../notif')
const ScreenParser = require('./screen_parser')
const ScreenRenderer = require('./screen_renderer')
const { ATTR_BLINK } = require('./screen_attr_bits')

module.exports = class TermScreen extends EventEmitter {
  constructor () {
    super()

    this.canvas = mk('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.parser = new ScreenParser(this)
    this.renderer = new ScreenRenderer(this)

    // debug screen handle
    this._debug = null

    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } else {
      console.warn('No AudioContext!')
    }

    // dummy. Handle for Input
    this.input = new Proxy({}, {
      get () {
        return () => console.warn('TermScreen#input not set!')
      }
    })
    // dummy. Handle for Conn
    this.conn = new Proxy({}, {
      get () {
        return () => console.warn('TermScreen#conn not set!')
      },
      set (a, b) {
        return () => console.warn('TermScreen#conn not set!')
      }
    })

    this.cursor = {
      x: 0,
      y: 0,
      blinking: true,
      visible: true,
      hanging: false,
      style: 'block'
    }

    this._window = {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      fontFamily: '"DejaVu Sans Mono", "Liberation Mono", "Inconsolata", "Menlo", monospace',
      fontSize: 20,
      padding: 6,
      gridScaleX: 1.0,
      gridScaleY: 1.2,
      fitIntoWidth: 0,
      fitIntoHeight: 0,
      // two bits. LSB: debug enabled by user, MSB: debug enabled by server
      debug: 0,
      graphics: 0,
      statusScreen: null
    }

    // scaling caused by fitIntoWidth/fitIntoHeight
    this._windowScale = 1

    // actual padding, as it may be disabled by fullscreen mode etc.
    this._padding = 0

    // properties of this.window that require updating size and redrawing
    this.windowState = {
      width: 0,
      height: 0,
      devicePixelRatio: 0,
      padding: 0,
      gridScaleX: 0,
      gridScaleY: 0,
      fontFamily: '',
      fontSize: 0,
      fitIntoWidth: 0,
      fitIntoHeight: 0
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
          this.selectable = value
          if (value) self.canvas.classList.add('selectable')
          else self.canvas.classList.remove('selectable')
        }
      }
    }

    // mouse features
    this.mouseMode = { clicks: false, movement: false }

    // make writing to window update size and draw
    this.window = new Proxy(this._window, {
      set (target, key, value, receiver) {
        if (target[key] !== value) {
          target[key] = value
          self.scheduleSizeUpdate()
          self.renderer.scheduleDraw(`window:${key}=${value}`)
          self.emit(`update-window:${key}`, value)
        }
        return true
      }
    })

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
      this.selection.start = this.selection.end = this.screenToGrid(x, y, true)
      this.renderer.scheduleDraw('select-start')
    }

    let selectMove = (x, y) => {
      if (!selecting) return
      this.selection.end = this.screenToGrid(x, y, true)
      this.renderer.scheduleDraw('select-move')
    }

    let selectEnd = (x, y) => {
      if (!selecting) return
      selecting = false
      this.selection.end = this.screenToGrid(x, y, true)
      this.renderer.scheduleDraw('select-end')
      Object.assign(this.selection, this.getNormalizedSelection())
    }

    // bind event listeners

    this.canvas.addEventListener('mousedown', e => {
      if ((this.selection.selectable || e.altKey) && e.button === 0) {
        selectStart(e.offsetX, e.offsetY)
      } else {
        this.input.onMouseDown(...this.screenToGrid(e.offsetX, e.offsetY),
          e.button + 1)
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
      let rect = this.canvas.getBoundingClientRect()
      return [touch.clientX - rect.left, touch.clientY - rect.top]
    }

    this.canvas.addEventListener('touchstart', e => {
      touchPosition = getTouchPositionOffset(e.touches[0])
      touchDidMove = false
      touchDownTime = Date.now()
    }, { passive: true })

    this.canvas.addEventListener('touchmove', e => {
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

    this.canvas.addEventListener('touchend', e => {
      if (e.touches[0]) {
        touchPosition = getTouchPositionOffset(e.touches[0])
      }

      if (selecting) {
        e.preventDefault()
        selectEnd(...touchPosition)

        // selection ended; show touch select menu
        let touchSelectMenu = qs('#touch-select-menu')
        touchSelectMenu.classList.add('open')
        let rect = touchSelectMenu.getBoundingClientRect()

        // use middle position for x and one line above for y
        let selectionPos = this.gridToScreen(
          (this.selection.start[0] + this.selection.end[0]) / 2,
          this.selection.start[1] - 1
        )
        selectionPos[0] -= rect.width / 2
        selectionPos[1] -= rect.height / 2
        touchSelectMenu.style.transform = `translate(${selectionPos[0]}px, ${
          selectionPos[1]}px)`
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
        qs('#touch-select-menu').classList.remove('open')
        this.renderer.scheduleDraw('select-reset')
      } else {
        e.preventDefault()
        this.emit('open-soft-keyboard')
      }
    })

    $.ready(() => {
      let copyButton = qs('#touch-select-copy-btn')
      if (copyButton) {
        copyButton.addEventListener('click', () => {
          this.copySelectionToClipboard()
        })
      }
    })

    this.canvas.addEventListener('mousemove', e => {
      if (!selecting) {
        this.input.onMouseMove(...this.screenToGrid(e.offsetX, e.offsetY))
      }
    })

    this.canvas.addEventListener('mouseup', e => {
      if (!selecting) {
        this.input.onMouseUp(...this.screenToGrid(e.offsetX, e.offsetY),
          e.button + 1)
      }
    })

    let aggregateWheelDelta = 0
    this.canvas.addEventListener('wheel', e => {
      if (this.mouseMode.clicks) {
        if (Math.abs(e.wheelDeltaY) === 120) {
          // mouse wheel scrolling
          this.input.onMouseWheel(...this.screenToGrid(e.offsetX, e.offsetY), e.deltaY > 0 ? 1 : -1)
        } else {
          // smooth scrolling
          aggregateWheelDelta -= e.wheelDeltaY
          if (Math.abs(aggregateWheelDelta) >= 40) {
            this.input.onMouseWheel(...this.screenToGrid(e.offsetX, e.offsetY), aggregateWheelDelta > 0 ? 1 : -1)
            aggregateWheelDelta = 0
          }
        }

        // prevent page scrolling
        e.preventDefault()
      }
    })

    this.canvas.addEventListener('contextmenu', e => {
      if (this.mouseMode.clicks) {
        // prevent mouse keys getting stuck
        e.preventDefault()
      }
      selectEnd(e.offsetX, e.offsetY)
    })
  }

  /**
   * Schedule a size update in the next millisecond
   */
  scheduleSizeUpdate () {
    clearTimeout(this._scheduledSizeUpdate)
    this._scheduledSizeUpdate = setTimeout(() => this.updateSize(), 1)
  }

  get backgroundImage () {
    return this.canvas.style.backgroundImage
  }

  set backgroundImage (value) {
    this.canvas.style.backgroundImage = value ? `url(${value})` : ''
    if (this.renderer.backgroundImage !== !!value) {
      this.renderer.backgroundImage = !!value
      this.renderer.resetDrawn()
      this.renderer.scheduleDraw('background-image')
    }
  }

  /**
   * Returns a CSS font string with this TermScreen's font settings and the
   * font modifiers.
   * @param {Object} modifiers
   * @param {string} [modifiers.style] - the font style
   * @param {string} [modifiers.weight] - the font weight
   * @returns {string} a CSS font string
   */
  getFont (modifiers = {}) {
    let fontStyle = modifiers.style || 'normal'
    let fontWeight = modifiers.weight || 'normal'
    return `${fontStyle} normal ${fontWeight} ${this.window.fontSize}px ${this.window.fontFamily}`
  }

  /**
   * Converts screen coordinates to grid coordinates.
   * @param {number} x - x in pixels
   * @param {number} y - y in pixels
   * @param {boolean} rounded - whether to round the coord, used for select highlighting
   * @returns {number[]} a tuple of (x, y) in cells
   */
  screenToGrid (x, y, rounded = false) {
    let cellSize = this.getCellSize()

    x = x / this._windowScale - this._padding
    y = y / this._windowScale - this._padding
    x = Math.floor((x + (rounded ? cellSize.width / 2 : 0)) / cellSize.width)
    y = Math.floor(y / cellSize.height)
    x = Math.max(0, Math.min(this.window.width - 1, x))
    y = Math.max(0, Math.min(this.window.height - 1, y))

    return [x, y]
  }

  /**
   * Converts grid coordinates to screen coordinates.
   * @param {number} x - x in cells
   * @param {number} y - y in cells
   * @param {boolean} [withScale] - when true, will apply window scale
   * @returns {number[]} a tuple of (x, y) in pixels
   */
  gridToScreen (x, y, withScale = false) {
    let cellSize = this.getCellSize()

    return [x * cellSize.width, y * cellSize.height].map(v => this._padding + (withScale ? v * this._windowScale : v))
  }

  /**
   * The character size, used for calculating the cell size. The space character
   * is used for measuring.
   * @returns {Object} the character size with `width` and `height` in pixels
   */
  getCharSize () {
    this.ctx.font = this.getFont()

    return {
      width: Math.floor(this.ctx.measureText(' ').width),
      height: this.window.fontSize
    }
  }

  /**
   * The cell size, which is the character size multiplied by the grid scale.
   * @returns {Object} the cell size with `width` and `height` in pixels
   */
  getCellSize () {
    let charSize = this.getCharSize()

    return {
      width: Math.ceil(charSize.width * this.window.gridScaleX),
      height: Math.ceil(charSize.height * this.window.gridScaleY)
    }
  }

  /**
   * Updates the canvas size if it changed
   */
  updateSize () {
    // see below (this is just updating it)
    this._window.devicePixelRatio = Math.ceil(this._windowScale * (window.devicePixelRatio || 1))

    let didChange = false
    for (let key in this.windowState) {
      if (this.windowState.hasOwnProperty(key) && this.windowState[key] !== this.window[key]) {
        didChange = true
        this.windowState[key] = this.window[key]
      }
    }

    if (didChange) {
      const {
        width,
        height,
        fitIntoWidth,
        fitIntoHeight,
        padding
      } = this.window
      const cellSize = this.getCellSize()

      // real height of the canvas element in pixels
      let realWidth = width * cellSize.width
      let realHeight = height * cellSize.height
      let originalWidth = realWidth

      if (fitIntoWidth && fitIntoHeight) {
        let terminalAspect = realWidth / realHeight
        let fitAspect = fitIntoWidth / fitIntoHeight

        if (terminalAspect < fitAspect) {
          // align heights
          realHeight = fitIntoHeight - 2 * padding
          realWidth = realHeight * terminalAspect
        } else {
          // align widths
          realWidth = fitIntoWidth - 2 * padding
          realHeight = realWidth / terminalAspect
        }
      }

      // store new window scale
      this._windowScale = realWidth / originalWidth

      realWidth += 2 * padding
      realHeight += 2 * padding

      // store padding
      this._padding = padding * (originalWidth / realWidth)

      // the DPR must be rounded to a very nice value to prevent gaps between cells
      let devicePixelRatio = this._window.devicePixelRatio = Math.ceil(this._windowScale * (window.devicePixelRatio || 1))

      this.canvas.width = (width * cellSize.width + 2 * Math.round(this._padding)) * devicePixelRatio
      this.canvas.style.width = `${realWidth}px`
      this.canvas.height = (height * cellSize.height + 2 * Math.round(this._padding)) * devicePixelRatio
      this.canvas.style.height = `${realHeight}px`

      // the screen has been cleared (by changing canvas width)
      this.renderer.resetDrawn()

      // draw immediately; the canvas shouldn't flash
      this.renderer.draw('update-size')
    }
  }

  resetScreen () {
    const { width, height } = this.window
    this.blinkingCellCount = 0
    this.screen.screen = new Array(width * height).fill(' ')
    this.screen.screenFG = new Array(width * height).fill(0)
    this.screen.screenBG = new Array(width * height).fill(0)
    this.screen.screenAttrs = new Array(width * height).fill(0)
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
          this.renderer.loadTheme(update.theme)
          this.renderer.setDefaultColors(update.defFG, update.defBG)
          this.cursor.visible = update.cursorVisible
          this.input.setAlts(...update.inputAlts)
          this.mouseMode.clicks = update.trackMouseClicks
          this.mouseMode.movement = update.trackMouseMovement
          this.input.setMouseMode(update.trackMouseClicks, update.trackMouseMovement)
          this.selection.setSelectable(!update.trackMouseClicks && !update.trackMouseMovement)
          if (this.cursor.blinking !== update.cursorBlinking) {
            this.cursor.blinking = update.cursorBlinking
            this.renderer.resetCursorBlink()
          }
          this.cursor.style = update.cursorStyle
          this.bracketedPaste = update.bracketedPaste
          this.reverseVideo = update.reverseVideo
          this.window.debug &= 0b01
          this.window.debug |= (+update.debugEnabled << 1)

          this.emit('TEMP:show-buttons', update.showButtons)
          this.emit('TEMP:show-links', update.showConfigLinks)
          break

        case 'cursor':
          if (this.cursor.x !== update.x || this.cursor.y !== update.y || this.cursor.hanging !== update.hanging) {
            this.cursor.x = update.x
            this.cursor.y = update.y
            this.cursor.hanging = update.hanging
            this.renderer.resetCursorBlink()
            this.emit('cursor-moved')
            this.renderer.scheduleDraw('cursor-moved')
          }
          break

        case 'title':
          this.emit('TEMP:update-title', update.title)
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

            if (this.screenAttrs[index] & ATTR_BLINK !== data[3] & ATTR_BLINK) {
              if (data[3] & ATTR_BLINK) this.blinkingCellCount++
              else this.blinkingCellCount--
            }

            this.screen[index] = data[0]
            this.screenFG[index] = data[1]
            this.screenBG[index] = data[2]
            this.screenAttrs[index] = data[3]
          }

          if (this.window.debug) console.log(`Blinking cells: ${this.blinkingCellCount}`)

          this.renderer.scheduleDraw('load', 16)
          this.conn.emit('load')
          this.emit('load')
          break

        case 'full-load-complete':
          this.emit('TEMP:hide-load-failed-msg')
          break

        default:
          console.log('Unhandled update', update)
      }
    }
  }
}
