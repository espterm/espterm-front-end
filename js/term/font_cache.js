module.exports = class GLFontCache {
  constructor (gl) {
    this.gl = gl

    // cache: string => WebGLTexture
    this.cache = new Map()
    this.dp = 1
    this.cellSize = { width: 0, height: 0 }

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
  }

  clearCache () {
    for (let texture of this.cache.values()) this.gl.deleteTexture(texture)
    this.cache = new Map()
  }

  getChar (font, character) {
    let name = `${font}@${this.dp}x:${character}`

    if (!this.cache.has(name)) {
      this.cache.set(name, this.render(font, character))
    }
    return this.cache.get(name)
  }

  render (font, character) {
    const { gl, ctx, dp, cellSize } = this

    let width = dp * cellSize.width * 3
    let height = dp * cellSize.height * 3
    if (this.canvas.width !== width) this.canvas.width = width
    if (this.canvas.height !== height) this.canvas.height = height

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.scale(dp, dp)

    if (ctx.font !== font) ctx.font = font

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'
    ctx.fillText(character, cellSize.width * 1.5, cellSize.height * 1.5)

    let imageData = ctx.getImageData(0, 0, width, height)

    let texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return texture
  }
}
