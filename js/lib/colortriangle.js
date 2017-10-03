/*
 * Copyright (c) 2010 Tim Baumann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// NOTE: Converted to ES6 by MightyPork (2017)
// Modified for ESPTerm

const EventEmitter = require('events')
const {
  rgb2hex,
  hex2rgb,
  hsl2rgb,
  rgb2hsl
} = require('./color_utils')

const win = window
const doc = document
const M = Math
const TAU = 2 * M.PI

function times (i, fn) {
  for (let j = 0; j < i; j++) {
    fn(j)
  }
}

function each (obj, fn) {
  if (obj.length) {
    times(obj.length, function (i) {
      fn(obj[i], i)
    })
  } else {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        fn(obj[key], key)
      }
    }
  }
}

module.exports = class ColorTriangle extends EventEmitter {
  /****************
   * ColorTriangle *
   ****************/

  // Constructor function:
  constructor (color, options) {
    super()

    this.options = {
      size: 150,
      padding: 8,
      triangleSize: 0.8,
      wheelPointerColor1: '#444',
      wheelPointerColor2: '#eee',
      trianglePointerSize: 16,
      // wheelPointerSize: 16,
      trianglePointerColor1: '#eee',
      trianglePointerColor2: '#444',
      background: 'transparent'
    }

    this.pixelRatio = window.devicePixelRatio

    this.setOptions(options)
    this.calculateProperties()

    this.createContainer()
    this.createTriangle()
    this.createWheel()
    this.createWheelPointer()
    this.createTrianglePointer()
    this.attachEvents()

    color = color || '#f00'
    if (typeof color == 'string') {
      this.setHEX(color)
    }
  }

  calculateProperties () {
    let opts = this.options

    this.padding = opts.padding
    this.innerSize = opts.size - opts.padding * 2
    this.triangleSize = opts.triangleSize * this.innerSize
    this.wheelThickness = (this.innerSize - this.triangleSize) / 2
    this.wheelPointerSize = opts.wheelPointerSize || this.wheelThickness

    this.wheelRadius = (this.innerSize) / 2
    this.triangleRadius = (this.triangleSize) / 2
    this.triangleSideLength = M.sqrt(3) * this.triangleRadius
  }

  calculatePositions () {
    const r = this.triangleRadius
    const hue = this.hue
    const third = TAU / 3
    const s = this.saturation
    const l = this.lightness

    // Colored point
    const hx = this.hx = M.cos(hue) * r
    const hy = this.hy = -M.sin(hue) * r
    // Black point
    const sx = this.sx = M.cos(hue - third) * r
    const sy = this.sy = -M.sin(hue - third) * r
    // White point
    const vx = this.vx = M.cos(hue + third) * r
    const vy = this.vy = -M.sin(hue + third) * r
    // Current point
    const mx = (sx + vx) / 2
    const my = (sy + vy) / 2
    const a = (1 - 2 * M.abs(l - 0.5)) * s
    this.x = sx + (vx - sx) * l + (hx - mx) * a
    this.y = sy + (vy - sy) * l + (hy - my) * a
  }

  createContainer () {
    let c = this.container = doc.createElement('div')
    c.className = 'color-triangle'

    c.style.display = 'block'
    c.style.padding = `${this.padding}px`
    c.style.position = 'relative'
    c.style.boxShadow = '0 1px 10px black'
    c.style.borderRadius = '5px'
    c.style.width = c.style.height = `${this.innerSize + 2 * this.padding}px`
    c.style.background = this.options.background
  }

  createWheel () {
    let c = this.wheel = doc.createElement('canvas')
    c.width = c.height = this.innerSize * this.pixelRatio
    c.style.width = c.style.height = `${this.innerSize}px`
    c.style.position = 'absolute'
    c.style.margin = c.style.padding = '0'
    c.style.left = c.style.top = `${this.padding}px`

    this.drawWheel(c.getContext('2d'))
    this.container.appendChild(c)
  }

  drawWheel (ctx) {
    let s, i

    ctx.save()
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    ctx.translate(this.wheelRadius, this.wheelRadius)
    s = this.wheelRadius - this.triangleRadius
    // Draw a circle for every color
    for (i = 0; i < 360; i++) {
      ctx.rotate(TAU / -360) // rotate one degree
      ctx.beginPath()
      ctx.fillStyle = 'hsl(' + i + ', 100%, 50%)'
      ctx.arc(this.wheelRadius - (s / 2), 0, s / 2, 0, TAU, true)
      ctx.fill()
    }
    ctx.restore()
  }

  createTriangle () {
    let c = this.triangle = doc.createElement('canvas')

    c.width = c.height = this.innerSize * this.pixelRatio
    c.style.width = c.style.height = `${this.innerSize}px`
    c.style.position = 'absolute'
    c.style.margin = c.style.padding = '0'
    c.style.left = c.style.top = this.padding + 'px'

    this.triangleCtx = c.getContext('2d')

    this.container.appendChild(c)
  }

  drawTriangle () {
    const hx = this.hx
    const hy = this.hy
    const sx = this.sx
    const sy = this.sy
    const vx = this.vx
    const vy = this.vy
    const size = this.innerSize

    let ctx = this.triangleCtx

    // clear
    ctx.clearRect(0, 0, size * this.pixelRatio, size * this.pixelRatio)

    ctx.save()
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    ctx.translate(this.wheelRadius, this.wheelRadius)

    // make a triangle
    ctx.beginPath()
    ctx.moveTo(hx, hy)
    ctx.lineTo(sx, sy)
    ctx.lineTo(vx, vy)
    ctx.closePath()
    ctx.clip()

    ctx.fillStyle = '#000'
    ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size)
    // => black triangle

    // create gradient from hsl(hue, 1, 1) to transparent
    let grad0 = ctx.createLinearGradient(hx, hy, (sx + vx) / 2, (sy + vy) / 2)
    const hsla = 'hsla(' + M.round(this.hue * (360 / TAU)) + ', 100%, 50%, '
    grad0.addColorStop(0, hsla + '1)')
    grad0.addColorStop(1, hsla + '0)')
    ctx.fillStyle = grad0
    ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size)
    // => gradient: one side of the triangle is black, the opponent angle is $color

    // create color gradient from white to transparent
    let grad1 = ctx.createLinearGradient(vx, vy, (hx + sx) / 2, (hy + sy) / 2)
    grad1.addColorStop(0, '#fff')
    grad1.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = grad1
    ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size)
    // => white angle

    ctx.restore()
  }

  // The two pointers
  createWheelPointer () {
    let c = this.wheelPointer = doc.createElement('canvas')
    const size = this.wheelPointerSize
    c.width = c.height = size * this.pixelRatio
    c.style.width = c.style.height = `${size}px`
    c.style.position = 'absolute'
    c.style.margin = c.style.padding = '0'
    this.drawPointer(c.getContext('2d'), size / 2, this.options.wheelPointerColor1, this.options.wheelPointerColor2)
    this.container.appendChild(c)
  }

  moveWheelPointer () {
    const r = this.wheelPointerSize / 2
    const s = this.wheelPointer.style
    s.top = this.padding + this.wheelRadius - M.sin(this.hue) * (this.triangleRadius + this.wheelThickness / 2) - r + 'px'
    s.left = this.padding + this.wheelRadius + M.cos(this.hue) * (this.triangleRadius + this.wheelThickness / 2) - r + 'px'
  }

  createTrianglePointer () { // create pointer in the triangle
    let c = this.trianglePointer = doc.createElement('canvas')
    const size = this.options.trianglePointerSize

    c.width = c.height = size * this.pixelRatio
    c.style.width = c.style.height = `${size}px`
    c.style.position = 'absolute'
    c.style.margin = c.style.padding = '0'
    this.drawPointer(c.getContext('2d'), size / 2, this.options.trianglePointerColor1, this.options.trianglePointerColor2)
    this.container.appendChild(c)
  }

  moveTrianglePointer (x, y) {
    const s = this.trianglePointer.style
    const r = this.options.trianglePointerSize / 2
    s.top = (this.y + this.wheelRadius + this.padding - r) + 'px'
    s.left = (this.x + this.wheelRadius + this.padding - r) + 'px'
  }

  drawPointer (ctx, r, color1, color2) {
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    ctx.fillStyle = color2
    ctx.beginPath()
    ctx.arc(r, r, r, 0, TAU, true)
    ctx.fill() // => black circle
    ctx.fillStyle = color1
    ctx.beginPath()
    ctx.arc(r, r, r - 2, 0, TAU, true)
    ctx.fill() // => white circle with 1px black border
    ctx.fillStyle = color2
    ctx.beginPath()
    ctx.arc(r, r, r / 4 + 2, 0, TAU, true)
    ctx.fill() // => black circle with big white border and a small black border
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(r, r, r / 4, 0, TAU, true)
    ctx.fill() // => transparent center
  }

  // The Element and the DOM
  inject (parent) {
    parent.appendChild(this.container)
  }

  getRelativeCoordinates (evt) {
    let elem = this.triangle
    let rect = elem.getBoundingClientRect()

    return {
      x: evt.clientX - rect.x,
      y: evt.clientY - rect.y
    }
  }

  dispose () {
    let parent = this.container.parentNode
    if (parent) {
      parent.removeChild(this.container)
    }
  }

  getElement () {
    return this.container
  }

  // Color accessors
  getCSS () {
    const h = Math.round(this.hue * (360 / TAU))
    const s = Math.round(this.saturation * 100)
    const l = Math.round(this.lightness * 100)

    return `hsl(${h}, ${s}%, ${l}%)`
  }

  getHEX () {
    return rgb2hex(...this.getRGB())
  }

  setHEX (hex) {
    this.setRGB(...hex2rgb(hex))
  }

  getRGB () {
    return hsl2rgb(...this.getHSL())
  }

  setRGB (r, g, b) {
    this.setHSL(...rgb2hsl(r, g, b))
  }

  getHSL () {
    return [this.hue, this.saturation, this.lightness]
  }

  setHSL (h, s, l) {
    this.hue = h
    this.saturation = s
    this.lightness = l

    this.initColor()
  }

  initColor () {
    this.calculatePositions()
    this.moveWheelPointer()
    this.drawTriangle()
    this.moveTrianglePointer()
  }

  // Mouse event handling
  attachEvents () {
    this.down = null

    let mousedown = (evt) => {
      evt.stopPropagation()
      evt.preventDefault()

      doc.body.addEventListener('mousemove', mousemove, false)
      doc.body.addEventListener('mouseup', mouseup, false)

      let xy = this.getRelativeCoordinates(evt)
      this.map(xy.x, xy.y)
    }

    let mousemove = (evt) => {
      let xy = this.getRelativeCoordinates(evt)
      this.move(xy.x, xy.y)
    }

    let mouseup = (evt) => {
      if (this.down) {
        this.down = null
        this.emit('dragend')
      }
      doc.body.removeEventListener('mousemove', mousemove, false)
      doc.body.removeEventListener('mouseup', mouseup, false)
    }

    this.container.addEventListener('mousedown', mousedown, false)
    this.container.addEventListener('mousemove', mousemove, false)
  }

  map (x, y) {
    let x0 = x
    let y0 = y
    x -= this.wheelRadius
    y -= this.wheelRadius

    const r = M.sqrt(x * x + y * y) // Pythagoras
    if (r > this.triangleRadius && r < this.wheelRadius) {
      // Wheel
      this.down = 'wheel'
      this.emit('dragstart')
      this.move(x0, y0)
    } else if (r < this.triangleRadius) {
      // Inner circle
      this.down = 'triangle'
      this.emit('dragstart')
      this.move(x0, y0)
    }
  }

  move (x, y) {
    if (!this.down) {
      return
    }

    x -= this.wheelRadius
    y -= this.wheelRadius

    let rad = M.atan2(-y, x)
    if (rad < 0) {
      rad += TAU
    }

    if (this.down === 'wheel') {
      this.hue = rad
      this.initColor()
      this.emit('drag')
    } else if (this.down === 'triangle') {
      // get radius and max radius
      let rad0 = (rad + TAU - this.hue) % TAU
      let rad1 = rad0 % (TAU / 3) - (TAU / 6)
      let a = 0.5 * this.triangleRadius
      let b = M.tan(rad1) * a
      let r = M.sqrt(x * x + y * y) // Pythagoras
      let maxR = M.sqrt(a * a + b * b) // Pythagoras

      if (r > maxR) {
        const dx = M.tan(rad1) * r
        let rad2 = M.atan(dx / maxR)
        if (rad2 > TAU / 6) {
          rad2 = TAU / 6
        } else if (rad2 < -TAU / 6) {
          rad2 = -TAU / 6
        }
        rad += rad2 - rad1

        rad0 = (rad + TAU - this.hue) % TAU
        rad1 = rad0 % (TAU / 3) - (TAU / 6)
        b = M.tan(rad1) * a
        r = maxR = M.sqrt(a * a + b * b) // Pythagoras
      }

      x = M.round(M.cos(rad) * r)
      y = M.round(-M.sin(rad) * r)

      const l = this.lightness = ((M.sin(rad0) * r) / this.triangleSideLength) + 0.5

      const widthShare = 1 - (M.abs(l - 0.5) * 2)
      let s = this.saturation = (((M.cos(rad0) * r) + (this.triangleRadius / 2)) / (1.5 * this.triangleRadius)) / widthShare
      s = M.max(0, s) // cannot be lower than 0
      s = M.min(1, s) // cannot be greater than 1

      this.lightness = l
      this.saturation = s

      this.x = x
      this.y = y
      this.moveTrianglePointer()

      this.emit('drag')
    }
  }

  /***************
   * Init helpers *
   ***************/

  static initInput (input, options) {
    options = options || {}

    let ct
    let openColorTriangle = function () {
      let hex = input.value
      if (options.parseColor) hex = options.parseColor(hex)
      if (!ct) {
        options.size = options.size || input.offsetWidth
        options.background = win.getComputedStyle(input, null).backgroundColor
        options.margin = options.margin || 10
        options.event = options.event || 'dragend'

        ct = new ColorTriangle(hex, options)
        ct.on(options.event, () => {
          const hex = ct.getHEX()
          input.value = options.uppercase ? hex.toUpperCase() : hex
          fireChangeEvent()
        })
      } else {
        ct.setHEX(hex)
      }

      let top = input.offsetTop
      if (win.innerHeight - input.getBoundingClientRect().top > input.offsetHeight + options.margin + options.size) {
        top += input.offsetHeight + options.margin // below
      } else {
        top -= options.margin + options.size // above
      }

      let el = ct.getElement()
      el.style.position = 'absolute'
      el.style.left = input.offsetLeft + 'px'
      el.style.top = top + 'px'
      el.style.zIndex = '1338' // above everything

      ct.inject(input.parentNode)
    }

    let closeColorTriangle = () => {
      if (ct) {
        ct.dispose()
      }
    }

    let fireChangeEvent = () => {
      let evt = doc.createEvent('HTMLEvents')
      evt.initEvent('input', true, false) // bubbles = true, cancable = false
      input.dispatchEvent(evt) // fire event
    }

    input.addEventListener('focus', openColorTriangle, false)
    input.addEventListener('blur', closeColorTriangle, false)
    input.addEventListener('keyup', () => {
      const val = input.value
      if (val.match(/^#((?:[0-9A-Fa-f]{3})|(?:[0-9A-Fa-f]{6}))$/)) {
        openColorTriangle()
        fireChangeEvent()
      } else {
        closeColorTriangle()
      }
    }, false)
  }

  /*******************
   * Helper functions *
   *******************/

  setOptions (opts) {
    opts = opts || {}
    let dflt = this.options
    let options = this.options = {}

    each(dflt, function (val, key) {
      options[key] = (opts.hasOwnProperty(key))
        ? opts[key]
        : val
    })
  }
}
