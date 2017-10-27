const EventEmitter = require('events')
const FontCache = require('./font_cache')
const { themes, getColor } = require('./themes')
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

module.exports = class WebGLRenderer extends EventEmitter {
  constructor (canvas) {
    super()

    this.canvas = canvas
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
    if (!this.gl) throw new Error('No WebGL context')

    this.fontCache = new FontCache(this.gl)

    this._palette = null
    this.defaultBG = 0
    this.defaultFG = 7

    this._debug = null

    // screen data, considered immutable
    this.width = 0
    this.height = 0
    this.padding = 0
    this.charSize = { width: 0, height: 0 }
    this.cellSize = { width: 0, height: 0 }
    this.fonts = ['', '', '', ''] // normal, bold, italic, bold-italic
    this.screen = []
    this.screenFG = []
    this.screenBG = []
    this.screenAttrs = []
    this.screenSelection = []
    this.cursor = {}
    this.reverseVideo = false
    this.hasBlinkingCells = false
    this.statusScreen = null

    this.blinkStyleOn = false
    this.blinkInterval = null
    this.cursorBlinkOn = false
    this.cursorBlinkInterval = null

    this.resetDrawn(100, 100)

    // start blink timers
    this.resetBlink()
    this.resetCursorBlink()

    this.init()
  }

  render (reason, data) {
    if ('hasBlinkingCells' in data && data.hasBlinkingCells !== this.hasBlinkingCells) {
      if (data.hasBlinkingCells) this.resetBlink()
      else clearInterval(this.blinkInterval)
    }

    Object.assign(this, data)
    this.scheduleDraw(reason)
  }

  resetDrawn (width, height) {
    this.gl.clearColor(0, 0, 0, 1)
    this.gl.viewport(0, 0, width, height)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
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
      this.emit('palette-update', palette)
      this.scheduleDraw('palette')
    }
  }

  getCharWidthFor (font) {
    this.fontCache.ctx.font = font
    return Math.floor(this.fontCache.ctx.measureText(' ').width)
  }

  loadTheme (i) {
    if (i in themes) this.palette = themes[i]
  }

  setDefaultColors (fg, bg) {
    if (fg !== this.defaultFG || bg !== this.defaultBG) {
      this.defaultFG = fg
      this.defaultBG = bg
      this.scheduleDraw('default-colors')

      // full bg with default color (goes behind the image)
      this.canvas.style.backgroundColor = this.getColor(bg)
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
    return WebGLRenderer.colorToRGBA(getColor(i, this.palette))
  }

  /**
   * Resets the cursor blink to on and restarts the timer
   */
  resetCursorBlink () {
    this.cursorBlinkOn = true
    clearInterval(this.cursorBlinkInterval)
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorBlinkOn = this.cursor.blinking ? !this.cursorBlinkOn : true
      if (this.cursor.blinking) this.scheduleDraw('cursor-blink')
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
      if (this.blinkingCellCount <= 0) return

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

  compileShader (vertex, fragment) {
    const { gl } = this
    let vert = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vert, vertex)
    gl.compileShader(vert)
    let frag = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(frag, fragment)
    gl.compileShader(frag)
    if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS) || !gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vert), gl.getShaderInfoLog(frag))
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      throw new Error('Shader compile error')
    }

    let shader = gl.createProgram()
    gl.attachShader(shader, vert)
    gl.attachShader(shader, frag)
    gl.linkProgram(shader)

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(shader))
      throw new Error('Shader link error')
    }

    return shader
  }

  init () {
    const { gl } = this

    let bgShader = this.compileShader(`
precision mediump float;
attribute vec2 position;
uniform mat4 projection;
uniform vec2 char_pos;
uniform vec2 extend;
void main() {
  vec2 scale = vec2(1.0 + abs(extend.x), 1.0 + abs(extend.y));
  vec2 offset = min(vec2(0.0, 0.0), extend);
  gl_Position = projection * vec4(char_pos + offset + scale * position, 0.0, 1.0);
}
    `, `
precision highp float;
uniform vec4 color;
void main() {
  gl_FragColor = color;
}
    `)

    let charShader = this.compileShader(`
precision mediump float;
attribute vec2 position;
uniform mat4 projection;
uniform vec2 char_pos;
varying highp vec2 tex_coord;
void main() {
  gl_Position = projection * vec4(char_pos - vec2(1.0, 1.0) + 3.0 * position, 0.0, 1.0);
  tex_coord = position;
}
    `, `
precision highp float;
uniform vec4 color;
uniform sampler2D texture;
varying highp vec2 tex_coord;
void main() {
  gl_FragColor = texture2D(texture, tex_coord) * color;
}
    `)

    this.bgShader = {
      shader: bgShader,
      attributes: {
        position: gl.getAttribLocation(bgShader, 'position')
      },
      uniforms: {
        projection: gl.getUniformLocation(bgShader, 'projection'),
        charPos: gl.getUniformLocation(bgShader, 'char_pos'),
        extend: gl.getUniformLocation(bgShader, 'extend'),
        color: gl.getUniformLocation(bgShader, 'color')
      }
    }

    this.charShader = {
      shader: charShader,
      attributes: {
        position: gl.getAttribLocation(charShader, 'position')
      },
      uniforms: {
        projection: gl.getUniformLocation(charShader, 'projection'),
        charPos: gl.getUniformLocation(charShader, 'char_pos'),
        color: gl.getUniformLocation(charShader, 'color'),
        texture: gl.getUniformLocation(charShader, 'texture')
      }
    }

    let buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      1, 1,
      0, 1,
      1, 0,
      0, 0
    ]), gl.STATIC_DRAW)
    this.squareBuffer = buffer
    this.useShader = (shader, projection) => {
      gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(shader.attributes.position)
      gl.useProgram(shader.shader)

      gl.uniformMatrix4fv(shader.uniforms.projection, false, projection)
    }
    this.drawSquare = () => {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
  }

  draw (reason) {
    const { gl, width, height, padding, devicePixelRatio } = this

    if (this.debug && this._debug) this._debug.drawStart(reason)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    this.fontCache.cellSize = this.cellSize
    this.fontCache.dp = devicePixelRatio

    let paddingX = padding / this.cellSize.width
    let paddingY = padding / this.cellSize.height

    let projection = new Float32Array([
      2 / (width + 2 * paddingX), 0, 0, 0,
      0, -2 / (height + 2 * paddingY), 0, 0,
      0, 0, 1, 0,
      -1 + 2 * paddingX / width, 1 - 2 * paddingY / height, 0, 1
    ])

    // draw background
    this.useShader(this.bgShader, projection)

    let textCells = {}

    for (let cell = 0; cell < width * height; cell++) {
      let x = cell % width
      let y = Math.floor(cell / width)
      let isCursor = this.cursorBlinkOn &&
        this.cursor.x === x &&
        this.cursor.y === y &&
        this.cursor.visible

      let text = this.screen[cell]
      let fg = this.screenFG[cell] | 0
      let bg = this.screenBG[cell] | 0
      let attrs = this.screenAttrs[cell] | 0
      let inSelection = this.screenSelection[cell]

      // let isDefaultBG = false

      if (!(attrs & ATTR_FG)) fg = this.defaultFG
      if (!(attrs & ATTR_BG)) {
        bg = this.defaultBG
        // isDefaultBG = true
      }

      if (attrs & ATTR_INVERSE) [fg, bg] = [bg, fg] // swap - reversed character colors
      if (this.reverseVideo) [fg, bg] = [bg, fg] // swap - reversed all screen

      if (attrs & ATTR_BLINK && !this.blinkStyleOn) {
        // blinking is enabled and blink style is off
        // set text to nothing so drawCharacter only draws decoration
        text = ' '
      }

      if (inSelection) {
        fg = -1
        bg = -2
      }

      // TODO: actual cursor
      if (isCursor) [fg, bg] = [bg, fg]

      gl.uniform2f(this.bgShader.uniforms.charPos, x, y)
      gl.uniform4f(this.bgShader.uniforms.color, ...this.getColor(bg))

      let extendX = 0
      let extendY = 0

      if (x === 0) extendX = -1
      if (x === width - 1) extendX = 1
      if (y === 0) extendY = -1
      if (y === height - 1) extendY = 1

      gl.uniform2f(this.bgShader.uniforms.extend, extendX, extendY)

      this.drawSquare()

      if (text.trim()) {
        let fontIndex = 0
        if (attrs & ATTR_BOLD) fontIndex |= 1
        if (attrs & ATTR_ITALIC) fontIndex |= 2
        let font = this.fonts[fontIndex]
        let type = font + text

        if (!textCells[type]) textCells[type] = []
        textCells[type].push({ x, y, text, font, fg })
      }
    }

    this.useShader(this.charShader, projection)
    gl.activeTexture(gl.TEXTURE0)

    for (let key in textCells) {
      let { font, text } = textCells[key][0]
      let texture = this.fontCache.getChar(font, text)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(this.charShader.uniforms.texture, 0)

      for (let cell of textCells[key]) {
        let { x, y, fg } = cell

        gl.uniform2f(this.charShader.uniforms.charPos, x, y)
        gl.uniform4f(this.charShader.uniforms.color, ...this.getColor(fg))

        this.drawSquare()
      }
    }

    if (this.debug && this._debug) this._debug.drawEnd()
  }

  static colorToRGBA (color) {
    color = color.substr(1)
    if (color.length === 3) {
      return [
        parseInt(color[0], 16) * 0x11 / 0xff,
        parseInt(color[1], 16) * 0x11 / 0xff,
        parseInt(color[2], 16) * 0x11 / 0xff,
        1
      ]
    } else {
      return [
        parseInt(color.substr(0, 2), 16) / 0xff,
        parseInt(color.substr(2, 2), 16) / 0xff,
        parseInt(color.substr(4, 2), 16) / 0xff,
        1
      ]
    }
  }
}
