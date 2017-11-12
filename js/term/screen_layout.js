const EventEmitter = require('events')
const CanvasRenderer = require('./screen_renderer')

const DEFAULT_FONT = '"DejaVu Sans Mono", "Liberation Mono", "Inconsolata", "Menlo", monospace'

/**
 * Manages terminal screen layout and sizing
 */
module.exports = class ScreenLayout extends EventEmitter {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.renderer = new CanvasRenderer(this.canvas)

    this._window = {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      fontFamily: DEFAULT_FONT,
      fontSize: 20,
      padding: 6,
      gridScaleX: 1.0,
      gridScaleY: 1.2,
      fitIntoWidth: 0,
      fitIntoHeight: 0,
      debug: false
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

    this.charSize = { width: 0, height: 0 }

    const self = this

    // make writing to window update size and draw
    this.window = new Proxy(this._window, {
      set (target, key, value) {
        if (target[key] !== value) {
          target[key] = value
          self.scheduleSizeUpdate()
          self.renderer.scheduleDraw(`window:${key}=${value}`)
          self.emit(`update-window:${key}`, value)
        }
        return true
      }
    })

    this.on('update-window:debug', debug => { this.renderer.debug = debug })

    this.canvas.addEventListener('mousedown', e => this.emit('mousedown', e))
    this.canvas.addEventListener('mousemove', e => this.emit('mousemove', e))
    this.canvas.addEventListener('mouseup', e => this.emit('mouseup', e))
    this.canvas.addEventListener('touchstart', e => this.emit('touchstart', e))
    this.canvas.addEventListener('touchmove', e => this.emit('touchmove', e))
    this.canvas.addEventListener('touchend', e => this.emit('touchend', e))
    this.canvas.addEventListener('wheel', e => this.emit('wheel', e))
    this.canvas.addEventListener('contextmenu', e => this.emit('contextmenu', e))
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

  get selectable () {
    return this.canvas.classList.contains('selectable')
  }

  set selectable (selectable) {
    if (selectable) this.canvas.classList.add('selectable')
    else this.canvas.classList.remove('selectable')
  }

  /**
   * Returns a CSS font string with the current font settings and the
   * specified modifiers.
   * @param {Object} modifiers
   * @param {string} [modifiers.style] - the font style
   * @param {string} [modifiers.weight] - the font weight
   * @returns {string} a CSS font string
   */
  getFont (modifiers = {}) {
    let fontStyle = modifiers.style || 'normal'
    let fontWeight = modifiers.weight || 'normal'
    let fontFamily = this.window.fontFamily || ''
    if (fontFamily.length > 0) fontFamily += ','
    fontFamily += DEFAULT_FONT
    return `${fontStyle} normal ${fontWeight} ${this.window.fontSize}px ${fontFamily}`
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
    y = Math.floor(y / cellSize.height)
    if (this.renderer.drawnScreenLines[y]) x /= 2 // double size
    x = Math.floor((x + (rounded ? cellSize.width / 2 : 0)) / cellSize.width)
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

    if (this.renderer.drawnScreenLines[y]) x *= 2 // double size

    return [x * cellSize.width, y * cellSize.height].map(v => this._padding + (withScale ? v * this._windowScale : v))
  }

  /**
   * Update the character size, used for calculating the cell size.
   * The space character is used for measuring.
   * @returns {Object} the character size with `width` and `height` in pixels
   */
  updateCharSize () {
    this.charSize = {
      width: this.renderer.getCharWidthFor(this.getFont()),
      height: this.window.fontSize
    }

    return this.charSize
  }

  /**
   * The cell size, which is the character size multiplied by the grid scale.
   * @returns {Object} the cell size with `width` and `height` in pixels
   */
  getCellSize () {
    if (!this.charSize.height && this.window.fontSize) this.updateCharSize()

    return {
      width: Math.ceil(this.charSize.width * this.window.gridScaleX),
      height: Math.ceil(this.charSize.height * this.window.gridScaleY)
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

      this.updateCharSize()
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

      this.renderer.render('update-size', this.serializeRenderData())

      this.emit('size-update')
    }
  }

  serializeRenderData () {
    return {
      padding: Math.round(this._padding),
      devicePixelRatio: this.window.devicePixelRatio,
      charSize: this.charSize,
      cellSize: this.getCellSize(),
      fonts: [
        this.getFont(),
        this.getFont({ weight: 'bold' }),
        this.getFont({ style: 'italic' }),
        this.getFont({ weight: 'bold', style: 'italic' })
      ]
    }
  }

  render (reason, data) {
    this.window.width = data.width
    this.window.height = data.height

    Object.assign(data, this.serializeRenderData())

    this.renderer.render(reason, data)
  }
}
