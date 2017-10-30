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

// Some non-bold Fraktur symbols are outside the contiguous block
const frakturExceptions = {
  'C': '\u212d',
  'H': '\u210c',
  'I': '\u2111',
  'R': '\u211c',
  'Z': '\u2128'
}

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
    this.backgroundImage = null

    this.blinkStyleOn = false
    this.blinkInterval = null
    this.cursorBlinkOn = false
    this.cursorBlinkInterval = null

    this.redrawLoop = false
    this.resetDrawn(100, 100)
    this.initTime = Date.now()

    this.init()

    // start loops and timers
    this.resetBlink()
    this.resetCursorBlink()
    this.startDrawLoop()
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
    if (this.backgroundImage) {
      this.gl.clearColor(0, 0, 0, 0)
      this.canvas.style.backgroundColor = getColor(this.defaultBG, this.palette)
    } else {
      this.gl.clearColor(...this.getColor(this.defaultBG))
      this.canvas.style.backgroundColor = null
    }
    if (width && height) {
      this.gl.viewport(0, 0, width, height)
    }
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
uniform bool clip;
varying highp vec2 tex_coord;
varying vec4 screen_pos;
void main() {
  if (clip) {
    gl_Position = projection * vec4(char_pos + position, 0.0, 1.0);
    screen_pos = vec4(position, 0.0, 1.0);
    tex_coord = position / 3.0 + vec2(1.0 / 3.0, 1.0 / 3.0);
  } else {
    gl_Position = projection * vec4(char_pos - vec2(1.0, 1.0) + 3.0 * position, 0.0, 1.0);
    screen_pos = vec4(3.0 * position - vec2(1.0, 1.0), 0.0, 1.0);
    tex_coord = position;
  }
}
    `, `
precision highp float;
uniform vec4 color;
uniform sampler2D texture;
uniform bool faint;
uniform bool overline;
uniform bool strike;
uniform bool underline;
varying highp vec2 tex_coord;
varying vec4 screen_pos;
void main() {
  gl_FragColor = texture2D(texture, tex_coord) * color;
  if (screen_pos.x >= 0.0 && screen_pos.x <= 1.0) {
    if (faint) {
      gl_FragColor.a /= 2.0;
    }
    if (overline) {
      if (screen_pos.y >= 0.0 && screen_pos.y <= 0.05) gl_FragColor = color;
    }
    if (strike) {
      if (screen_pos.y >= 0.475 && screen_pos.y <= 0.525) gl_FragColor = color;
    }
    if (underline) {
      if (screen_pos.y >= 0.95 && screen_pos.y <= 1.0) gl_FragColor = color;
    }
  }
}
    `)

    let fboShader = this.compileShader(`
precision mediump float;
attribute vec2 position;
uniform mat4 projection;
varying highp vec2 tex_coord;
void main() {
  gl_Position = projection * vec4(position, 0.0, 1.0);
  tex_coord = position;
}
    `, `
precision highp float;
uniform sampler2D texture;
uniform vec2 pixel_scale;
uniform float time;
varying highp vec2 tex_coord;
float hue_to_rgb (float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}
vec4 hsl_to_rgb (vec4 hsl) {
  vec4 rgb = vec4(0);
  rgb.a = hsl.a;
  hsl.x = mod(hsl.x, 1.0);
  if (hsl.y == 0.0) {
    rgb.r = hsl.z;
    rgb.g = hsl.z;
    rgb.b = hsl.z;
  } else {
    float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
    float p = 2.0 * hsl.z - q;
    rgb.r = hue_to_rgb(p, q, hsl.x + 1.0 / 3.0);
    rgb.g = hue_to_rgb(p, q, hsl.x);
    rgb.b = hue_to_rgb(p, q, hsl.x - 1.0 / 3.0);
  }
  return rgb;
}
vec4 rgb_to_hsl (vec4 rgb) {
  float max_rgb = max(rgb.r, max(rgb.g, rgb.b));
  float min_rgb = min(rgb.r, min(rgb.g, rgb.b));
  float lightness = (max_rgb + min_rgb) / 2.0;
  float hue = 0.0, saturation = 0.0;
  if (max_rgb != min_rgb) {
    float vd = max_rgb - min_rgb;
    saturation = lightness > 0.5 ? vd / (2.0 - max_rgb - min_rgb) : vd / (max_rgb + min_rgb);
    if (max_rgb == rgb.r) hue = (rgb.g - rgb.b) / vd + (rgb.g < rgb.b ? 6.0 : 0.0);
    else if (max_rgb == rgb.g) hue = (rgb.b - rgb.r) / vd + 2.0;
    else if (max_rgb == rgb.b) hue = (rgb.r - rgb.g) / vd + 4.0;
    hue /= 6.0;
  }
  return vec4(hue, saturation, lightness, rgb.a);
}
vec2 bulge (vec2 v) {
  vec2 norm = v * 2.0 - 1.0;
  float hypot = length(norm);
  return ((norm * (hypot / 4.0 + 1.0) / 1.25) + 1.0) / 2.0;
}
void main() {
  // gl_FragColor = texture2D(texture, tex_coord);

  // bulge, lines, bloom
  vec4 sum = vec4(0);
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      sum += texture2D(texture, bulge(tex_coord + vec2(i, j) * pixel_scale)) * 0.07;
    }
  }
  gl_FragColor = sum * sum + texture2D(texture, bulge(tex_coord)) * (0.5 * sin(bulge(tex_coord).y / pixel_scale.y) + 0.5);

  /* CRT-ish effect (requires draw on every animation frame!)
  vec4 sum = vec4(0);

  for (int i = -4; i <= 4; i++) {
    for (int j = -4; j <= 4; j++) {
      sum += texture2D(texture, tex_coord + vec2(j, i) * pixel_scale) * 0.07;
    }
  }
  float factor = 0.05 + 0.02 * sin(time * 5.0);
  if (mod(tex_coord.y / pixel_scale.y, 10.0) < 5.0) {
    factor += 0.1;
  }
  float beam_y = (mod(-time, 9.0) - 1.5) / 6.0;
  if (abs(tex_coord.y - beam_y) < 0.05) {
    factor += 0.2 * cos((tex_coord.y - beam_y) / 0.05 * 1.57);
  }
  gl_FragColor = sum * sum * factor + texture2D(texture, tex_coord); */
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
        texture: gl.getUniformLocation(charShader, 'texture'),
        clip: gl.getUniformLocation(charShader, 'clip'),
        faint: gl.getUniformLocation(charShader, 'faint'),
        overline: gl.getUniformLocation(charShader, 'overline'),
        strike: gl.getUniformLocation(charShader, 'strike'),
        underline: gl.getUniformLocation(charShader, 'underline')
      }
    }

    this.fboShader = {
      shader: fboShader,
      attributes: {
        position: gl.getAttribLocation(fboShader, 'position')
      },
      uniforms: {
        projection: gl.getUniformLocation(fboShader, 'projection'),
        pixelScale: gl.getUniformLocation(fboShader, 'pixel_scale'),
        time: gl.getUniformLocation(fboShader, 'time'),
        texture: gl.getUniformLocation(fboShader, 'texture')
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

    // frame buffers

    let maxBuffers = gl.getParameter(gl.getExtension('WEBGL_draw_buffers').MAX_COLOR_ATTACHMENTS_WEBGL)
    let createBuffer = i => {
      let buffer = gl.createFramebuffer()
      let texture = gl.createTexture()

      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      return { buffer, texture }
    }

    if (maxBuffers >= 2) {
      this.buffers = {
        drawing: createBuffer(0),
        display: createBuffer(1)
      }
    } else {
      let buffer = createBuffer(0)
      this.buffers = { drawing: buffer, display: buffer }
    }
  }

  draw (reason) {
    const { gl, width, height, padding, devicePixelRatio, statusScreen } = this
    let { screen, screenFG, screenBG, screenAttrs } = this

    // ;[this.buffers.drawing, this.buffers.display] = [this.buffers.display, this.buffers.drawing]

    let drawingBuffer = this.buffers.drawing
    gl.bindFramebuffer(gl.FRAMEBUFFER, drawingBuffer.buffer)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, drawingBuffer.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    if (statusScreen) {
      this.redrawLoop = true

      screen = new Array(width * height).fill(' ')
      screenFG = new Array(width * height).fill(this.defaultFG)
      screenBG = new Array(width * height).fill(this.defaultBG)
      screenAttrs = new Array(width * height).fill(ATTR_FG | ATTR_BG)

      let text = statusScreen.title
      for (let i = 0; i < Math.min(width * height, text.length); i++) {
        screen[i] = text[i]
      }
      if (statusScreen.loading) {
        let t = Date.now() / 1000

        for (let i = width; i < Math.min(width * height, width + 8); i++) {
          let offset = ((t * 12) - i) % 12
          let value = Math.max(0.2, 1 - offset / 3) * 255
          screenFG[i] = 256 + value + (value << 8) + (value << 16)
          screen[i] = '*'
        }
      }
    } else this.redrawLoop = false

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

      let text = screen[cell]
      let fg = screenFG[cell] | 0
      let bg = screenBG[cell] | 0
      let attrs = screenAttrs[cell] | 0
      let inSelection = this.screenSelection[cell]

      if (!(cell in screen)) continue
      if (statusScreen) isCursor = false

      let isDefaultBG = false

      if (!(attrs & ATTR_FG)) fg = this.defaultFG
      if (!(attrs & ATTR_BG)) {
        bg = this.defaultBG
        isDefaultBG = true
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

      if (!this.backgroundImage || !isDefaultBG) {
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
      }

      if (text.trim() || isCursor || attrs) {
        let fontIndex = 0
        if (attrs & ATTR_BOLD) fontIndex |= 1
        if (attrs & ATTR_ITALIC) fontIndex |= 2
        let font = this.fonts[fontIndex]
        if (attrs & ATTR_FRAKTUR) text = WebGLRenderer.alphaToFraktur(text)
        let type = font + text

        if (!textCells[type]) textCells[type] = []
        textCells[type].push({ x, y, text, font, fg, bg, attrs, isCursor })
      }
    }

    this.useShader(this.charShader, projection)
    gl.activeTexture(gl.TEXTURE1)

    for (let key in textCells) {
      let { font, text } = textCells[key][0]
      let texture = this.fontCache.getChar(font, text)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(this.charShader.uniforms.texture, 1)

      for (let cell of textCells[key]) {
        let { x, y, fg, bg, attrs, isCursor } = cell

        gl.uniform2f(this.charShader.uniforms.charPos, x, y)
        gl.uniform4f(this.charShader.uniforms.color, ...this.getColor(fg))

        gl.uniform1i(this.charShader.uniforms.faint, (attrs & ATTR_FAINT) > 0)
        gl.uniform1i(this.charShader.uniforms.overline, (attrs & ATTR_OVERLINE) > 0)
        gl.uniform1i(this.charShader.uniforms.strike, (attrs & ATTR_STRIKE) > 0)
        gl.uniform1i(this.charShader.uniforms.underline, (attrs & ATTR_UNDERLINE) > 0)

        this.drawSquare()

        if (isCursor) {
          if (fg === bg) {
            fg = 7
            bg = 0
          }

          this.useShader(this.bgShader, projection)
          gl.uniform2f(this.bgShader.uniforms.extend, 0, 0)
          gl.uniform2f(this.bgShader.uniforms.charPos, x, y)
          gl.uniform4f(this.bgShader.uniforms.color, ...this.getColor(fg))
          this.drawSquare()

          this.useShader(this.charShader, projection)
          gl.uniform4f(this.charShader.uniforms.color, ...this.getColor(bg))
          gl.uniform1i(this.charShader.uniforms.clip, true)
          this.drawSquare()
          gl.uniform1i(this.charShader.uniforms.clip, false)
        }
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.drawFrame()

    if (this.debug && this._debug) this._debug.drawEnd()
  }

  drawFrame () {
    const { gl } = this
    let drawingBuffer = this.buffers.drawing

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, drawingBuffer.texture)
    this.useShader(this.fboShader, [
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      -1, -1, 0, 1
    ])
    gl.uniform2f(this.fboShader.uniforms.pixelScale, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight)
    gl.uniform1i(this.fboShader.uniforms.texture, 0)
    gl.uniform1f(this.fboShader.uniforms.time, ((Date.now() - this.initTime) / 1000) % 86400)
    this.drawSquare()
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
    if (this.redrawLoop) this.draw('draw-loop')
    // uncomment for an update every frame (GPU-intensive)
    // (also, lots of errors in Chrome. TODO: investigate)
    // this.drawFrame()
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
