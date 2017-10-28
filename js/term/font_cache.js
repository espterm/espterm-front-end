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
    this.drawCharacter(character)

    let imageData = ctx.getImageData(0, 0, width, height)

    let texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return texture
  }

  drawCharacter (character) {
    const { ctx, cellSize } = this

    let screenX = cellSize.width
    let screenY = cellSize.height

    let codePoint = character.codePointAt(0)
    if (codePoint >= 0x2580 && codePoint <= 0x259F) {
      // block elements
      ctx.beginPath()
      const left = screenX
      const top = screenY
      const cw = cellSize.width
      const ch = cellSize.height
      const c2w = cellSize.width / 2
      const c2h = cellSize.height / 2

      // http://www.fileformat.info/info/unicode/block/block_elements/utf8test.htm
      //         0x00  0x01  0x02  0x03  0x04  0x05  0x06  0x07  0x08  0x09  0x0A  0x0B  0x0C  0x0D  0x0E  0x0F
      // 0x2580     ▀     ▁     ▂     ▃     ▄     ▅     ▆     ▇     █     ▉     ▊     ▋     ▌     ▍     ▎     ▏
      // 0x2590     ▐     ░     ▒     ▓     ▔     ▕     ▖     ▗     ▘     ▙     ▚     ▛     ▜     ▝     ▞     ▟

      if (codePoint === 0x2580) {
        // upper half block >▀<
        ctx.rect(left, top, cw, c2h)
      } else if (codePoint <= 0x2588) {
        // lower n eighth block (increasing) >▁< to >█<
        let offset = (1 - (codePoint - 0x2580) / 8) * ch
        ctx.rect(left, top + offset, cw, ch - offset)
      } else if (codePoint <= 0x258F) {
        // left n eighth block (decreasing) >▉< to >▏<
        let offset = (codePoint - 0x2588) / 8 * cw
        ctx.rect(left, top, cw - offset, ch)
      } else if (codePoint === 0x2590) {
        // right half block >▐<
        ctx.rect(left + c2w, top, c2w, ch)
      } else if (codePoint <= 0x2593) {
        // shading >░< >▒< >▓<

        // dot spacing by dividing cell size by a constant. This could be
        // reworked to always return a whole number, but that would require
        // prime factorization, and doing that without a loop would let you
        // take over the world, which is not within the scope of this project.
        let dotSpacingX, dotSpacingY, dotSize
        if (codePoint === 0x2591) {
          dotSpacingX = cw / 4
          dotSpacingY = ch / 10
          dotSize = 1
        } else if (codePoint === 0x2592) {
          dotSpacingX = cw / 6
          dotSpacingY = cw / 10
          dotSize = 1
        } else if (codePoint === 0x2593) {
          dotSpacingX = cw / 4
          dotSpacingY = cw / 7
          dotSize = 2
        }

        let alignRight = false
        for (let dy = 0; dy < ch; dy += dotSpacingY) {
          for (let dx = 0; dx < cw; dx += dotSpacingX) {
            // prevent overflow
            let dotSizeY = Math.min(dotSize, ch - dy)
            ctx.rect(left + (alignRight ? cw - dx - dotSize : dx), top + dy, dotSize, dotSizeY)
          }
          alignRight = !alignRight
        }
      } else if (codePoint === 0x2594) {
        // upper one eighth block >▔<
        ctx.rect(left, top, cw, ch / 8)
      } else if (codePoint === 0x2595) {
        // right one eighth block >▕<
        ctx.rect(left + (7 / 8) * cw, top, cw / 8, ch)
      } else if (codePoint === 0x2596) {
        // left bottom quadrant >▖<
        ctx.rect(left, top + c2h, c2w, c2h)
      } else if (codePoint === 0x2597) {
        // right bottom quadrant >▗<
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x2598) {
        // left top quadrant >▘<
        ctx.rect(left, top, c2w, c2h)
      } else if (codePoint === 0x2599) {
        // left chair >▙<
        ctx.rect(left, top, c2w, ch)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259A) {
        // quadrants lt rb >▚<
        ctx.rect(left, top, c2w, c2h)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259B) {
        // left chair upside down >▛<
        ctx.rect(left, top, c2w, ch)
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259C) {
        // right chair upside down >▜<
        ctx.rect(left, top, cw, c2h)
        ctx.rect(left + c2w, top + c2h, c2w, c2h)
      } else if (codePoint === 0x259D) {
        // right top quadrant >▝<
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259E) {
        // quadrants lb rt >▞<
        ctx.rect(left, top + c2h, c2w, c2h)
        ctx.rect(left + c2w, top, c2w, c2h)
      } else if (codePoint === 0x259F) {
        // right chair upside down >▟<
        ctx.rect(left, top + c2h, c2w, c2h)
        ctx.rect(left + c2w, top, c2w, ch)
      }

      ctx.fill()
    } else if (codePoint >= 0xE0B0 && codePoint <= 0xE0B3) {
      // powerline symbols, except branch, line, and lock. Basically, just the triangles
      ctx.beginPath()

      if (codePoint === 0xE0B0 || codePoint === 0xE0B1) {
        // right-pointing triangle
        ctx.moveTo(screenX, screenY)
        ctx.lineTo(screenX + cellSize.width, screenY + cellSize.height / 2)
        ctx.lineTo(screenX, screenY + cellSize.height)
      } else if (codePoint === 0xE0B2 || codePoint === 0xE0B3) {
        // left-pointing triangle
        ctx.moveTo(screenX + cellSize.width, screenY)
        ctx.lineTo(screenX, screenY + cellSize.height / 2)
        ctx.lineTo(screenX + cellSize.width, screenY + cellSize.height)
      }

      if (codePoint % 2 === 0) {
        // triangle
        ctx.fill()
      } else {
        // chevron
        ctx.strokeStyle = ctx.fillStyle
        ctx.stroke()
      }
    } else {
      // Draw other characters using the text renderer
      ctx.fillText(character, cellSize.width * 1.5, cellSize.height * 1.5)
    }
  }
}
