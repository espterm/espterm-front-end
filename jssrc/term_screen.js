// Some non-bold Fraktur symbols are outside the contiguous block
const frakturExceptions = {
  'C': '\u212d',
  'H': '\u210c',
  'I': '\u2111',
  'R': '\u211c',
  'Z': '\u2128'
}

// constants for decoding the update blob
const SEQ_REPEAT = 2
const SEQ_SET_COLORS = 3
const SEQ_SET_ATTRS = 4
const SEQ_SET_FG = 5
const SEQ_SET_BG = 6

const SELECTION_BG = '#b2d7fe'
const SELECTION_FG = '#333'

const themes = [
  [ // Tango
    '#111213', '#CC0000', '#4E9A06', '#C4A000', '#3465A4', '#75507B', '#06989A', '#D3D7CF',
    '#555753', '#EF2929', '#8AE234', '#FCE94F', '#729FCF', '#AD7FA8', '#34E2E2', '#EEEEEC'
  ],
  [ // Linux
    '#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
    '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff'
  ],
  [ // xterm
    '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
    '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff'
  ],
  [ // rxvt
    '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000cd', '#cd00cd', '#00cdcd', '#faebd7',
    '#404040', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'
  ],
  [ // Ambience
    '#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf',
    '#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'
  ],
  [ // Solarized
    '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
    '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4', '#93a1a1', '#fdf6e3'
  ]
]

// TODO move this to the initializer so it's not run on non-terminal pages

// 256color lookup table
// should not be used to look up 0-15 (will return transparent)
const colorTable256 = new Array(16).fill('rgba(0, 0, 0, 0)')

// fill color table
// colors 16-231 are a 6x6x6 color cube
for (let red = 0; red < 6; red++) {
  for (let green = 0; green < 6; green++) {
    for (let blue = 0; blue < 6; blue++) {
      let redValue = red * 40 + (red ? 55 : 0)
      let greenValue = green * 40 + (green ? 55 : 0)
      let blueValue = blue * 40 + (blue ? 55 : 0)
      colorTable256.push(`rgb(${redValue}, ${greenValue}, ${blueValue})`)
    }
  }
}
// colors 232-255 are a grayscale ramp, sans black and white
for (let gray = 0; gray < 24; gray++) {
  let value = gray * 10 + 8
  colorTable256.push(`rgb(${value}, ${value}, ${value})`)
}

window.TermScreen = class TermScreen {
  constructor () {
    this.canvas = mk('canvas')
    this.ctx = this.canvas.getContext('2d')

    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } else {
      console.warn('No AudioContext!')
    }

    this.cursor = {
      x: 0,
      y: 0,
      blinkOn: false,
      blinking: true,
      visible: true,
      hanging: false,
      style: 'block',
      blinkInterval: null
    }

    this._palette = null

    this._window = {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      fontFamily: '"DejaVu Sans Mono", "Liberation Mono", "Inconsolata", "Menlo", monospace',
      fontSize: 20,
      gridScaleX: 1.0,
      gridScaleY: 1.2,
      blinkStyleOn: true,
      blinkInterval: null,
      fitIntoWidth: 0,
      fitIntoHeight: 0,
      debug: false,
      graphics: 0
    }

    // scaling caused by fitIntoWidth/fitIntoHeight
    this._windowScale = 1

    // properties of this.window that require updating size and redrawing
    this.windowState = {
      width: 0,
      height: 0,
      devicePixelRatio: 0,
      gridScaleX: 0,
      gridScaleY: 0,
      fontFamily: '',
      fontSize: 0,
      fitIntoWidth: 0,
      fitIntoHeight: 0
    }

    // current selection
    this.selection = {
      // when false, this will prevent selection in favor of mouse events,
      // though alt can be held to override it
      selectable: true,

      // selection start and end (x, y) tuples
      start: [0, 0],
      end: [0, 0]
    }

    // mouse features
    this.mouseMode = { clicks: false, movement: false }

    // event listeners
    this._listeners = {}

    // make writing to window update size and draw
    const self = this
    this.window = new Proxy(this._window, {
      set (target, key, value, receiver) {
        target[key] = value
        self.scheduleSizeUpdate()
        self.scheduleDraw(`window:${key}=${value}`)
        return true
      }
    })

    this.blinkingCellCount = 0

    this.screen = []
    this.screenFG = []
    this.screenBG = []
    this.screenAttrs = []

    // used to determine if a cell should be redrawn; storing the current state
    // as it is on screen
    this.drawnScreen = []
    this.drawnScreenFG = []
    this.drawnScreenBG = []
    this.drawnScreenAttrs = []
    this.drawnCursor = [-1, -1, '']

    // start blink timers
    this.resetBlink()
    this.resetCursorBlink()

    let selecting = false

    let selectStart = (x, y) => {
      if (selecting) return
      selecting = true
      this.selection.start = this.selection.end = this.screenToGrid(x, y)
      this.scheduleDraw('select-start')
    }

    let selectMove = (x, y) => {
      if (!selecting) return
      this.selection.end = this.screenToGrid(x, y)
      this.scheduleDraw('select-move')
    }

    let selectEnd = (x, y) => {
      if (!selecting) return
      selecting = false
      this.selection.end = this.screenToGrid(x, y)
      this.scheduleDraw('select-end')
      Object.assign(this.selection, this.getNormalizedSelection())
    }

    // bind event listeners

    this.canvas.addEventListener('mousedown', e => {
      if ((this.selection.selectable || e.altKey) && e.button === 0) {
        selectStart(e.offsetX, e.offsetY)
      } else {
        Input.onMouseDown(...this.screenToGrid(e.offsetX, e.offsetY),
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
    })

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

      if (!touchDidMove) {
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
        this.scheduleDraw('select-reset')
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
        Input.onMouseMove(...this.screenToGrid(e.offsetX, e.offsetY))
      }
    })

    this.canvas.addEventListener('mouseup', e => {
      if (!selecting) {
        Input.onMouseUp(...this.screenToGrid(e.offsetX, e.offsetY),
          e.button + 1)
      }
    })

    this.canvas.addEventListener('wheel', e => {
      if (this.mouseMode.clicks) {
        Input.onMouseWheel(...this.screenToGrid(e.offsetX, e.offsetY),
          e.deltaY > 0 ? 1 : -1)

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

    // bind ctrl+shift+c to copy
    key('⌃+⇧+c', e => {
      e.preventDefault()
      this.copySelectionToClipboard()
    })
  }

  /**
   * Bind an event listener to an event
   * @param {string} event - the event name
   * @param {Function} listener - the event listener
   */
  on (event, listener) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push({ listener })
  }

  /**
   * Bind an event listener to be run only once the next time the event fires
   * @param {string} event - the event name
   * @param {Function} listener - the event listener
   */
  once (event, listener) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push({ listener, once: true })
  }

  /**
   * Remove an event listener
   * @param {string} event - the event name
   * @param {Function} listener - the event listener
   */
  off (event, listener) {
    let listeners = this._listeners[event]
    if (listeners) {
      for (let i in listeners) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1)
          break
        }
      }
    }
  }

  /**
   * Emits an event
   * @param {string} event - the event name
   * @param {...any} args - arguments passed to all listeners
   */
  emit (event, ...args) {
    let listeners = this._listeners[event]
    if (listeners) {
      let remove = []
      for (let listener of listeners) {
        try {
          listener.listener(...args)
          if (listener.once) remove.push(listener)
        } catch (err) {
          console.error(err)
        }
      }

      // this needs to be done in this roundabout way because for loops
      // do not like arrays with changing lengths
      for (let listener of remove) {
        listeners.splice(listeners.indexOf(listener), 1)
      }
    }
  }

  /**
   * The color palette. Should define 16 colors in an array.
   * @type {number[]}
   */
  get palette () {
    return this._palette || themes[0]
  }

  set palette (palette) {
    if (this._palette !== palette) {
      this._palette = palette
      this.scheduleDraw('palette')
    }
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
    if (this.palette[i]) return this.palette[i]

    // -1 for selection foreground, -2 for selection background
    if (i === -1) return SELECTION_FG
    if (i === -2) return SELECTION_BG

    // 256 color
    if (i > 15 && i < 256) return colorTable256[i]

    // true color, encoded as (hex) + 256 (such that #000 == 256)
    if (i > 255) {
      i -= 256
      let red = (i >> 16) & 0xFF
      let green = (i >> 8) & 0xFF
      let blue = i & 0xFF
      return `rgb(${red}, ${green}, ${blue})`
    }

    // default to transparent
    return 'rgba(0, 0, 0, 0)'
  }

  /**
   * Schedule a size update in the next millisecond
   */
  scheduleSizeUpdate () {
    clearTimeout(this._scheduledSizeUpdate)
    this._scheduledSizeUpdate = setTimeout(() => this.updateSize(), 1)
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
    this._window.devicePixelRatio = window.devicePixelRatio || 1

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
        devicePixelRatio,
        gridScaleX,
        gridScaleY,
        fitIntoWidth,
        fitIntoHeight
      } = this.window
      const cellSize = this.getCellSize()

      // real height of the canvas element in pixels
      let realWidth = width * cellSize.width
      let realHeight = height * cellSize.height

      if (fitIntoWidth && fitIntoHeight) {
        if (realWidth > fitIntoWidth || realHeight > fitIntoHeight) {
          let terminalAspect = realWidth / realHeight
          let fitAspect = fitIntoWidth / fitIntoHeight

          if (terminalAspect < fitAspect) {
            // align heights
            realHeight = fitIntoHeight
            realWidth = realHeight * terminalAspect
          } else {
            // align widths
            realWidth = fitIntoWidth
            realHeight = realWidth / terminalAspect
          }
        }
      } else if (fitIntoWidth && realWidth > fitIntoWidth) {
        realHeight = fitIntoWidth / (realWidth / realHeight)
        realWidth = fitIntoWidth
      } else if (fitIntoHeight && realHeight > fitIntoHeight) {
        realWidth = fitIntoHeight * (realWidth / realHeight)
        realHeight = fitIntoHeight
      }

      // store new window scale
      this._windowScale = realWidth / (width * cellSize.width)

      this.canvas.width = width * devicePixelRatio * cellSize.width
      this.canvas.style.width = `${realWidth}px`
      this.canvas.height = height * devicePixelRatio * cellSize.height
      this.canvas.style.height = `${realHeight}px`

      // the screen has been cleared (by changing canvas width)
      this.drawnScreen = []
      this.drawnScreenFG = []
      this.drawnScreenBG = []
      this.drawnScreenAttrs = []

      // draw immediately; the canvas shouldn't flash
      this.draw('init')
    }
  }

  /**
   * Resets the cursor blink to on and restarts the timer
   */
  resetCursorBlink () {
    this.cursor.blinkOn = true
    clearInterval(this.cursor.blinkInterval)
    this.cursor.blinkInterval = setInterval(() => {
      this.cursor.blinkOn = this.cursor.blinking
        ? !this.cursor.blinkOn
        : true
      if (this.cursor.blinking) this.scheduleDraw('cursor-blink')
    }, 500)
  }

  /**
   * Resets the blink style to on and restarts the timer
   */
  resetBlink () {
    this.window.blinkStyleOn = true
    clearInterval(this.window.blinkInterval)
    let intervals = 0
    this.window.blinkInterval = setInterval(() => {
      if (this.blinkingCellCount <= 0) return

      intervals++
      if (intervals >= 4 && this.window.blinkStyleOn) {
        this.window.blinkStyleOn = false
        intervals = 0
      } else if (intervals >= 1 && !this.window.blinkStyleOn) {
        this.window.blinkStyleOn = true
        intervals = 0
      }
    }, 200)
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
      Notify.show('Copied to clipboard')
    } else {
      Notify.show('Failed to copy')
    }
    document.body.removeChild(textarea)
  }

  /**
   * Converts screen coordinates to grid coordinates.
   * @param {number} x - x in pixels
   * @param {number} y - y in pixels
   * @returns {number[]} a tuple of (x, y) in cells
   */
  screenToGrid (x, y) {
    let cellSize = this.getCellSize()

    return [
      Math.floor((x + cellSize.width / 2) / cellSize.width),
      Math.floor(y / cellSize.height)
    ]
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

    return [x * cellSize.width, y * cellSize.height].map(v => withScale ? v * this._windowScale : v)
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
  drawCellBackground ({ x, y, cellWidth, cellHeight, bg }) {
    const ctx = this.ctx
    ctx.fillStyle = this.getColor(bg)
    ctx.clearRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight))
    ctx.fillRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight))
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
  drawCell ({ x, y, charSize, cellWidth, cellHeight, text, fg, attrs }) {
    if (!text) return

    const ctx = this.ctx

    let underline = false
    let strike = false
    let overline = false
    if (attrs & (1 << 1)) ctx.globalAlpha = 0.5
    if (attrs & (1 << 3)) underline = true
    if (attrs & (1 << 5)) text = TermScreen.alphaToFraktur(text)
    if (attrs & (1 << 6)) strike = true
    if (attrs & (1 << 7)) overline = true

    ctx.fillStyle = this.getColor(fg)
    ctx.fillText(text, (x + 0.5) * cellWidth, (y + 0.5) * cellHeight)

    if (underline || strike || overline) {
      ctx.strokeStyle = this.getColor(fg)
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.beginPath()

      if (underline) {
        let lineY = Math.round(y * cellHeight + charSize.height) + 0.5
        ctx.moveTo(x * cellWidth, lineY)
        ctx.lineTo((x + 1) * cellWidth, lineY)
      }

      if (strike) {
        let lineY = Math.round((y + 0.5) * cellHeight) + 0.5
        ctx.moveTo(x * cellWidth, lineY)
        ctx.lineTo((x + 1) * cellWidth, lineY)
      }

      if (overline) {
        let lineY = Math.round(y * cellHeight) + 0.5
        ctx.moveTo(x * cellWidth, lineY)
        ctx.lineTo((x + 1) * cellWidth, lineY)
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
    const { width, height } = this.window
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
      gridScaleX,
      gridScaleY
    } = this.window

    const charSize = this.getCharSize()
    const { width: cellWidth, height: cellHeight } = this.getCellSize()
    const screenWidth = width * cellWidth
    const screenHeight = height * cellHeight
    const screenLength = width * height

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

    if (this.window.debug && this._debug) this._debug.drawStart(why)

    ctx.font = this.getFont()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // bits in the attr value that affect the font
    const FONT_MASK = 0b101

    // Map of (attrs & FONT_MASK) -> Array of cell indices
    let fontGroups = new Map()

    // Map of (cell index) -> boolean, whether or not a cell has updated
    let updateMap = new Map()

    for (let cell = 0; cell < screenLength; cell++) {
      let x = cell % width
      let y = Math.floor(cell / width)
      let isCursor = !this.cursor.hanging &&
        this.cursor.x === x &&
        this.cursor.y === y &&
        this.cursor.blinkOn &&
        this.cursor.visible

      let wasCursor = x === this.drawnCursor[0] && y === this.drawnCursor[1]

      let inSelection = this.isInSelection(x, y)

      let text = this.screen[cell]
      let fg = this.screenFG[cell]
      let bg = this.screenBG[cell]
      let attrs = this.screenAttrs[cell]

      if (attrs & (1 << 4) && !this.window.blinkStyleOn) {
        // blinking is enabled and blink style is off
        // set text to nothing so drawCell doesn't draw anything
        text = ''
      }

      if (inSelection) {
        fg = -1
        bg = -2
      }

      let didUpdate = text !== this.drawnScreen[cell] ||
        fg !== this.drawnScreenFG[cell] ||
        bg !== this.drawnScreenBG[cell] ||
        attrs !== this.drawnScreenAttrs[cell] ||
        isCursor !== wasCursor ||
        (isCursor && this.cursor.style !== this.drawnCursor[2])

      let font = attrs & FONT_MASK
      if (!fontGroups.has(font)) fontGroups.set(font, [])

      fontGroups.get(font).push([cell, x, y, text, fg, bg, attrs, isCursor, inSelection])
      updateMap.set(cell, didUpdate)
    }

    // Map of (cell index) -> boolean, whether or not a cell should be redrawn
    const redrawMap = new Map()

    let isTextWide = text =>
      text !== ' ' && ctx.measureText(text).width >= (cellWidth + 0.05)

    // decide for each cell if it should be redrawn
    let updateRedrawMapAt = cell => {
      let shouldUpdate = updateMap.get(cell) || redrawMap.get(cell)

      // TODO: fonts (necessary?)
      let text = this.screen[cell]
      let isWideCell = isTextWide(text)
      let checkRadius = isWideCell ? 2 : 1

      if (!shouldUpdate) {
        // check adjacent cells
        let adjacentDidUpdate = false

        for (let adjacentCell of this.getAdjacentCells(cell, checkRadius)) {
          if (updateMap.get(adjacentCell)) {
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
    if (this.window.graphics >= 1) {
      ctx.save()
      ctx.beginPath()
      for (let y = 0; y < height; y++) {
        let regionStart = null
        for (let x = 0; x < width; x++) {
          let cell = y * width + x
          let redrawing = redrawMap.get(cell)
          if (redrawing && regionStart === null) regionStart = x
          if (!redrawing && regionStart !== null) {
            ctx.rect(regionStart * cellWidth, y * cellHeight, (x - regionStart) * cellWidth, cellHeight)
            regionStart = null
          }
        }
        if (regionStart !== null) {
          ctx.rect(regionStart * cellWidth, y * cellHeight, (width - regionStart) * cellWidth, cellHeight)
        }
      }
      ctx.clip()
    }

    // pass 1: backgrounds
    for (let font of fontGroups.keys()) {
      for (let data of fontGroups.get(font)) {
        let [cell, x, y, text, fg, bg, attrs, isCursor] = data

        if (redrawMap.get(cell)) {
          this.drawCellBackground({ x, y, cellWidth, cellHeight, bg })
        }
      }
    }

    // pass 2: characters
    for (let font of fontGroups.keys()) {
      // set font once because in Firefox, this is a really slow action for some
      // reason
      let modifiers = {}
      if (font & 1) modifiers.weight = 'bold'
      if (font & 1 << 2) modifiers.style = 'italic'
      ctx.font = this.getFont(modifiers)

      for (let data of fontGroups.get(font)) {
        let [cell, x, y, text, fg, bg, attrs, isCursor, inSelection] = data

        if (redrawMap.get(cell)) {
          this.drawCell({
            x, y, charSize, cellWidth, cellHeight, text, fg, attrs
          })

          this.drawnScreen[cell] = text
          this.drawnScreenFG[cell] = fg
          this.drawnScreenBG[cell] = bg
          this.drawnScreenAttrs[cell] = attrs

          if (isCursor) this.drawnCursor = [x, y, this.cursor.style]

          if (this.window.debug && this._debug) {
            // set cell flags
            let flags = 1 // always redrawn
            flags |= (+updateMap.get(cell)) << 1
            flags |= (+isTextWide(text)) << 2
            this._debug.setCell(cell, flags)
          }
        }

        if (isCursor && !inSelection) {
          ctx.save()
          ctx.beginPath()
          if (this.cursor.style === 'block') {
            // block
            ctx.rect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
          } else if (this.cursor.style === 'bar') {
            // vertical bar
            let barWidth = 2
            ctx.rect(x * cellWidth, y * cellHeight, barWidth, cellHeight)
          } else if (this.cursor.style === 'line') {
            // underline
            let lineHeight = 2
            ctx.rect(x * cellWidth, y * cellHeight + charSize.height, cellWidth, lineHeight)
          }
          ctx.clip()

          // swap foreground/background
          ;[fg, bg] = [bg, fg]

          // HACK: ensure cursor is visible
          if (fg === bg) bg = fg === 0 ? 7 : 0

          this.drawCellBackground({ x, y, cellWidth, cellHeight, bg })
          this.drawCell({
            x, y, charSize, cellWidth, cellHeight, text, fg, attrs
          })
          ctx.restore()
        }
      }
    }

    if (this.window.graphics >= 1) ctx.restore()

    if (this.window.debug && this._debug) this._debug.drawEnd()
  }

  /**
   * Parses the content of an `S` message and schedules a draw
   * @param {string} str - the message content
   */
  loadContent (str) {
    // current index
    let i = 0
    // Uncomment to capture screen content for the demo page
    // console.log(JSON.stringify(`S${str}`))

    // window size
    const newHeight = parse2B(str, i)
    const newWidth = parse2B(str, i + 2)
    const resized = (this.window.height !== newHeight) || (this.window.width !== newWidth)
    this.window.height = newHeight
    this.window.width = newWidth
    i += 4

    // cursor position
    let [cursorY, cursorX] = [parse2B(str, i), parse2B(str, i + 2)]
    i += 4
    let cursorMoved = (cursorX !== this.cursor.x || cursorY !== this.cursor.y)
    this.cursor.x = cursorX
    this.cursor.y = cursorY

    if (cursorMoved) {
      this.resetCursorBlink()
      this.emit('cursor-moved')
    }

    // attributes
    let attributes = parse3B(str, i)
    i += 3

    this.cursor.visible = !!(attributes & 1)
    this.cursor.hanging = !!(attributes & (1 << 1))

    Input.setAlts(
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

    if (cursorStyle === 0) this.cursor.style = 'block'
    else if (cursorStyle === 1) this.cursor.style = 'line'
    else if (cursorStyle === 2) this.cursor.style = 'bar'

    if (this.cursor.blinking !== cursorBlinking) {
      this.cursor.blinking = cursorBlinking
      this.resetCursorBlink()
    }

    Input.setMouseMode(trackMouseClicks, trackMouseMovement)
    this.selection.selectable = !trackMouseMovement
    $(this.canvas).toggleClass('selectable', !trackMouseMovement)
    this.mouseMode = {
      clicks: trackMouseClicks,
      movement: trackMouseMovement
    }

    let showButtons = !!(attributes & (1 << 7))
    let showConfigLinks = !!(attributes & (1 << 8))

    $('.x-term-conf-btn').toggleClass('hidden', !showConfigLinks)
    $('#action-buttons').toggleClass('hidden', !showButtons)

    // content
    let fg = 7
    let bg = 0
    let attrs = 0
    let cell = 0 // cell index
    let lastChar = ' '
    let screenLength = this.window.width * this.window.height

    if (resized) {
      this.updateSize()
      this.blinkingCellCount = 0
      this.screen = new Array(screenLength).fill(' ')
      this.screenFG = new Array(screenLength).fill(' ')
      this.screenBG = new Array(screenLength).fill(' ')
      this.screenAttrs = new Array(screenLength).fill(' ')
    }

    let strArray = !undef(Array.from) ? Array.from(str) : str.split('')

    const MASK_LINE_ATTR = 0xC8
    const MASK_BLINK = 1 << 4

    let setCellContent = () => {
      // Remove blink attribute if it wouldn't have any effect
      let myAttrs = attrs
      if ((myAttrs & MASK_BLINK) !== 0 &&
        ((lastChar === ' ' && ((myAttrs & MASK_LINE_ATTR) === 0)) || // no line styles
          fg === bg // invisible text
        )
      ) {
        myAttrs ^= MASK_BLINK
      }
      // update blinking cells counter if blink state changed
      if ((this.screenAttrs[cell] & MASK_BLINK) !== (myAttrs & MASK_BLINK)) {
        if (myAttrs & MASK_BLINK) this.blinkingCellCount++
        else this.blinkingCellCount--
      }

      this.screen[cell] = lastChar
      this.screenFG[cell] = fg
      this.screenBG[cell] = bg
      this.screenAttrs[cell] = myAttrs
    }

    while (i < strArray.length && cell < screenLength) {
      let character = strArray[i++]
      let charCode = character.codePointAt(0)

      let data
      switch (charCode) {
        case SEQ_REPEAT:
          let count = parse2B(strArray[i] + strArray[i + 1])
          i += 2
          for (let j = 0; j < count; j++) {
            setCellContent(cell)
            if (++cell > screenLength) break
          }
          break

        case SEQ_SET_COLORS:
          data = parse3B(strArray[i] + strArray[i + 1] + strArray[i + 2])
          i += 3
          fg = data & 0xFF
          bg = (data >> 8) & 0xFF
          break

        case SEQ_SET_ATTRS:
          data = parse2B(strArray[i] + strArray[i + 1])
          i += 2
          attrs = data & 0xFF
          break

        case SEQ_SET_FG:
          data = parse2B(strArray[i] + strArray[i + 1])
          i += 2
          fg = data & 0xFF
          break

        case SEQ_SET_BG:
          data = parse2B(strArray[i] + strArray[i + 1])
          i += 2
          bg = data & 0xFF
          break

        default:
          if (charCode < 32) character = '\ufffd'
          lastChar = character
          setCellContent(cell)
          cell++
      }
    }

    if (this.window.debug) console.log(`Blinky cells = ${this.blinkingCellCount}`)

    this.scheduleDraw('load', 16)
    this.emit('load')
  }

  /**
   * Parses the content of a `T` message and updates the screen title and button
   * labels.
   * @param {string} str - the message content
   */
  loadLabels (str) {
    let pieces = str.split('\x01')
    qs('h1').textContent = pieces[0]
    $('#action-buttons button').forEach((button, i) => {
      let label = pieces[i + 1].trim()
      // if empty string, use the "dim" effect and put nbsp instead to
      // stretch the button vertically
      button.innerHTML = label ? esc(label) : '&nbsp;'
      button.style.opacity = label ? 1 : 0.2
    })
  }

  /**
   * Shows an actual notification (if possible) or a notification balloon.
   * @param {string} text - the notification content
   */
  showNotification (text) {
    console.info(`Notification: ${text}`)
    if (Notification && Notification.permission === 'granted') {
      let notification = new Notification('ESPTerm', {
        body: text
      })
      notification.addEventListener('click', () => window.focus())
    } else {
      if (Notification && Notification.permission !== 'denied') {
        Notification.requestPermission()
      } else {
        // Fallback using the built-in notification balloon
        Notify.show(text)
      }
    }
  }

  /**
   * Loads a message from the server, and optionally a theme.
   * @param {string} str - the message
   * @param {number} [theme] - the new theme index
   */
  load (str, theme = -1) {
    const content = str.substr(1)
    if (theme >= 0 && theme < themes.length) {
      Screen.palette = themes[theme]
    }

    switch (str[0]) {
      case 'S':
        this.loadContent(content)
        break

      case 'T':
        this.loadLabels(content)
        break

      case 'B':
        this.beep()
        break

      case 'G':
        this.showNotification(content)
        break

      default:
        console.warn(`Bad data message type; ignoring.\n${JSON.stringify(str)}`)
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

    let osc, gain

    // main beep
    osc = audioCtx.createOscillator()
    gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    gain.gain.value = 0.5
    osc.frequency.value = 750
    osc.type = 'sine'
    osc.start()
    osc.stop(audioCtx.currentTime + 0.05)

    // surrogate beep (making it sound like 'oops')
    osc = audioCtx.createOscillator()
    gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    gain.gain.value = 0.2
    osc.frequency.value = 400
    osc.type = 'sine'
    osc.start(audioCtx.currentTime + 0.05)
    osc.stop(audioCtx.currentTime + 0.08)
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
      character = frakturExceptions[character] || String.fromCodePoint(
        0x1d504 - 0x41 + character.charCodeAt(0))
    }
    return character
  }
}
