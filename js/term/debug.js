const { mk } = require('../utils')

module.exports = function attachDebugger (screen, connection) {
  const debugCanvas = mk('canvas')
  const ctx = debugCanvas.getContext('2d')

  debugCanvas.classList.add('debug-canvas')

  let mouseHoverCell = null
  let updateToolbar

  let onMouseMove = e => {
    mouseHoverCell = screen.layout.screenToGrid(e.offsetX, e.offsetY)
    startDrawing()
    updateToolbar()
  }
  let onMouseOut = () => (mouseHoverCell = null)

  let addCanvas = function () {
    if (!debugCanvas.parentNode) {
      screen.layout.canvas.parentNode.appendChild(debugCanvas)
      screen.layout.canvas.addEventListener('mousemove', onMouseMove)
      screen.layout.canvas.addEventListener('mouseout', onMouseOut)
    }
  }
  let removeCanvas = function () {
    if (debugCanvas.parentNode) {
      debugCanvas.parentNode.removeChild(debugCanvas)
      screen.layout.canvas.removeEventListener('mousemove', onMouseMove)
      screen.layout.canvas.removeEventListener('mouseout', onMouseOut)
      onMouseOut()
    }
  }
  let updateCanvasSize = function () {
    let { width, height, devicePixelRatio } = screen.layout.window
    let cellSize = screen.layout.getCellSize()
    debugCanvas.width = width * cellSize.width * devicePixelRatio
    debugCanvas.height = height * cellSize.height * devicePixelRatio
    debugCanvas.style.width = `${width * cellSize.width}px`
    debugCanvas.style.height = `${height * cellSize.height}px`
  }

  let drawInfo = mk('div')
  drawInfo.classList.add('draw-info')

  let startTime, endTime, lastReason
  let cells = new Map()
  let clippedRects = []
  let updateFrames = []

  let startDrawing

  screen._debug = screen.layout.renderer._debug = {
    drawStart (reason) {
      lastReason = reason
      startTime = Date.now()
      clippedRects = []
    },
    drawEnd () {
      endTime = Date.now()
      drawInfo.textContent = `Draw: ${lastReason} (${(endTime - startTime)} ms), fancy gfx=${screen.layout.renderer.graphics}`
      startDrawing()
    },
    setCell (cell, flags) {
      cells.set(cell, [flags, Date.now()])
    },
    clipRect (...args) {
      clippedRects.push(args)
    },
    pushFrame (frame) {
      frame.push(Date.now())
      updateFrames.push(frame)
      startDrawing()
    }
  }

  let clipPattern
  {
    let patternCanvas = document.createElement('canvas')
    patternCanvas.width = patternCanvas.height = 12
    let pctx = patternCanvas.getContext('2d')
    pctx.lineWidth = 1
    pctx.strokeStyle = '#00f'
    pctx.beginPath()
    pctx.moveTo(0, 0)
    pctx.lineTo(0 - 4, 12)
    pctx.moveTo(4, 0)
    pctx.lineTo(4 - 4, 12)
    pctx.moveTo(8, 0)
    pctx.lineTo(8 - 4, 12)
    pctx.moveTo(12, 0)
    pctx.lineTo(12 - 4, 12)
    pctx.moveTo(16, 0)
    pctx.lineTo(16 - 4, 12)
    pctx.stroke()
    clipPattern = ctx.createPattern(patternCanvas, 'repeat')
  }

  let isDrawing = false
  let lastDrawTime = 0
  let t = 0

  let drawLoop = function () {
    if (isDrawing) window.requestAnimationFrame(drawLoop)

    let dt = (Date.now() - lastDrawTime) / 1000
    lastDrawTime = Date.now()
    t += dt

    let { devicePixelRatio, width, height } = screen.layout.window
    let { width: cellWidth, height: cellHeight } = screen.layout.getCellSize()
    let screenLength = width * height
    let now = Date.now()

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, width * cellWidth, height * cellHeight)

    let activeCells = 0
    for (let cell = 0; cell < screenLength; cell++) {
      if (!cells.has(cell) || cells.get(cell)[0] === 0) continue

      let [flags, timestamp] = cells.get(cell)
      let elapsedTime = (now - timestamp) / 1000

      if (elapsedTime > 1) continue

      activeCells++
      ctx.globalAlpha = 0.5 * Math.max(0, 1 - elapsedTime)

      let x = cell % width
      let y = Math.floor(cell / width)

      if (flags & 1) {
        // redrawn
        ctx.fillStyle = '#f0f'
      }
      if (flags & 2) {
        // updated
        ctx.fillStyle = '#0f0'
      }

      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)

      if (flags & 4) {
        // wide cell
        ctx.lineWidth = 2
        ctx.strokeStyle = '#f00'
        ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
      }
    }

    if (clippedRects.length) {
      ctx.globalAlpha = 0.5
      ctx.beginPath()

      for (let rect of clippedRects) {
        ctx.rect(...rect)
      }

      ctx.fillStyle = clipPattern
      ctx.fill()
    }

    let didDrawUpdateFrames = false
    if (updateFrames.length) {
      let framesToDelete = []
      for (let frame of updateFrames) {
        let time = frame[4]
        let elapsed = Date.now() - time
        if (elapsed > 1000) framesToDelete.push(frame)
        else {
          didDrawUpdateFrames = true
          ctx.globalAlpha = 1 - elapsed / 1000
          ctx.strokeStyle = '#ff0'
          ctx.lineWidth = 2
          ctx.strokeRect(frame[0] * cellWidth, frame[1] * cellHeight, frame[2] * cellWidth, frame[3] * cellHeight)
        }
      }
      for (let frame of framesToDelete) {
        updateFrames.splice(updateFrames.indexOf(frame), 1)
      }
    }

    if (mouseHoverCell) {
      ctx.save()
      ctx.globalAlpha = 1
      ctx.lineWidth = 1 + 0.5 * Math.sin(t * 10)
      ctx.strokeStyle = '#fff'
      ctx.lineJoin = 'round'
      ctx.setLineDash([2, 2])
      ctx.lineDashOffset = t * 10
      ctx.strokeRect(mouseHoverCell[0] * cellWidth, mouseHoverCell[1] * cellHeight, cellWidth, cellHeight)
      ctx.lineDashOffset += 2
      ctx.strokeStyle = '#000'
      ctx.strokeRect(mouseHoverCell[0] * cellWidth, mouseHoverCell[1] * cellHeight, cellWidth, cellHeight)
      ctx.restore()
    }

    if (activeCells === 0 && !mouseHoverCell && !didDrawUpdateFrames) {
      isDrawing = false
      removeCanvas()
    }
  }

  startDrawing = function () {
    if (isDrawing) return
    addCanvas()
    updateCanvasSize()
    isDrawing = true
    lastDrawTime = Date.now()
    drawLoop()
  }

  // debug toolbar
  const toolbar = mk('div')
  toolbar.classList.add('debug-toolbar')
  let toolbarAttached = false

  const heartbeat = mk('div')
  heartbeat.classList.add('heartbeat')
  heartbeat.textContent = '❤'
  toolbar.appendChild(heartbeat)

  const dataDisplay = mk('div')
  dataDisplay.classList.add('data-display')
  toolbar.appendChild(dataDisplay)

  const internalDisplay = mk('div')
  internalDisplay.classList.add('internal-display')
  toolbar.appendChild(internalDisplay)

  toolbar.appendChild(drawInfo)

  const buttons = mk('div')
  buttons.classList.add('toolbar-buttons')
  toolbar.appendChild(buttons)

  // heartbeat
  connection.on('heartbeat', () => {
    heartbeat.classList.remove('beat')
    window.requestAnimationFrame(() => {
      heartbeat.classList.add('beat')
    })
  })

  {
    const redraw = mk('button')
    redraw.textContent = 'Redraw'
    redraw.addEventListener('click', e => {
      screen.layout.renderer.resetDrawn()
      screen.layout.renderer.draw('debug-redraw')
    })
    buttons.appendChild(redraw)

    const fancyGraphics = mk('button')
    fancyGraphics.textContent = 'Toggle Fancy Graphics'
    fancyGraphics.addEventListener('click', e => {
      screen.layout.renderer.graphics = +!screen.layout.renderer.graphics
      screen.layout.renderer.draw('set-graphics')
    })
    buttons.appendChild(fancyGraphics)
  }

  const attachToolbar = function () {
    screen.layout.canvas.parentNode.appendChild(toolbar)
  }
  const detachToolbar = function () {
    toolbar.parentNode.removeChild(toolbar)
  }

  screen.on('update-window:debug', debug => {
    if (debug !== toolbarAttached) {
      toolbarAttached = debug
      if (debug) attachToolbar()
      else {
        detachToolbar()
        removeCanvas()
      }
    }
  })

  const displayCellAttrs = attrs => {
    let result = attrs.toString(16)
    if (attrs & 1 || attrs & 2) {
      result += ':has('
      if (attrs & 1) result += 'fg'
      if (attrs & 2) result += (attrs & 1 ? ',' : '') + 'bg'
      result += ')'
    }
    let attributes = []
    if (attrs & (1 << 2)) attributes.push('\\[bold]bold\\()')
    if (attrs & (1 << 3)) attributes.push('\\[underline]underln\\()')
    if (attrs & (1 << 4)) attributes.push('\\[invert]invert\\()')
    if (attrs & (1 << 5)) attributes.push('blink')
    if (attrs & (1 << 6)) attributes.push('\\[italic]italic\\()')
    if (attrs & (1 << 7)) attributes.push('\\[strike]strike\\()')
    if (attrs & (1 << 8)) attributes.push('\\[overline]overln\\()')
    if (attrs & (1 << 9)) attributes.push('\\[faint]faint\\()')
    if (attrs & (1 << 10)) attributes.push('fraktur')
    if (attributes.length) result += ':' + attributes.join()
    return result.trim()
  }

  const formatColor = color => color < 256 ? color : `#${`000000${(color - 256).toString(16)}`.substr(-6)}`
  const getCellData = cell => {
    if (cell < 0 || cell > screen.screen.length) return '(-)'
    let cellAttrs = screen.layout.renderer.drawnScreenAttrs[cell] | 0
    let cellFG = screen.layout.renderer.drawnScreenFG[cell] | 0
    let cellBG = screen.layout.renderer.drawnScreenBG[cell] | 0
    let fgText = formatColor(cellFG)
    let bgText = formatColor(cellBG)
    fgText += `\\[color=${screen.layout.renderer.getColor(cellFG).replace(/ /g, '')}]●\\[]`
    bgText += `\\[color=${screen.layout.renderer.getColor(cellBG).replace(/ /g, '')}]●\\[]`
    let cellCode = (screen.layout.renderer.drawnScreen[cell] || '').codePointAt(0) | 0
    let hexcode = cellCode.toString(16).toUpperCase()
    if (hexcode.length < 4) hexcode = `0000${hexcode}`.substr(-4)
    hexcode = `U+${hexcode}`
    let x = cell % screen.window.width
    let y = Math.floor(cell / screen.window.width)
    return `((${y},${x})=${cell}:\\[bold]${hexcode}\\[]:F${fgText}:B${bgText}:A(${displayCellAttrs(cellAttrs)}))`
  }

  const setFormattedText = (node, text) => {
    node.innerHTML = ''

    let match
    let attrs = {}

    let pushSpan = content => {
      let span = mk('span')
      node.appendChild(span)
      span.textContent = content
      for (let key in attrs) span[key] = attrs[key]
    }

    while ((match = text.match(/\\\[(.*?)\]/))) {
      if (match.index > 0) pushSpan(text.substr(0, match.index))

      attrs = { style: '' }
      let data = match[1].split(' ')
      for (let attr of data) {
        if (!attr) continue
        let key, value
        if (attr.indexOf('=') > -1) {
          key = attr.substr(0, attr.indexOf('='))
          value = attr.substr(attr.indexOf('=') + 1)
        } else {
          key = attr
          value = true
        }

        if (key === 'bold') attrs.style += 'font-weight:bold;'
        if (key === 'italic') attrs.style += 'font-style:italic;'
        if (key === 'underline') attrs.style += 'text-decoration:underline;'
        if (key === 'invert') attrs.style += 'background:#000;filter:invert(1);'
        if (key === 'strike') attrs.style += 'text-decoration:line-through;'
        if (key === 'overline') attrs.style += 'text-decoration:overline;'
        if (key === 'faint') attrs.style += 'opacity:0.5;'
        else if (key === 'color') attrs.style += `color:${value};`
        else attrs[key] = value
      }

      text = text.substr(match.index + match[0].length)
    }

    if (text) pushSpan(text)
  }

  let internalInfo = {}

  updateToolbar = () => {
    if (!toolbarAttached) return
    let text = `C((${screen.cursor.y},${screen.cursor.x}),hang:${screen.cursor.hanging},vis:${screen.cursor.visible})`
    if (mouseHoverCell) {
      text += ' m' + getCellData(mouseHoverCell[1] * screen.window.width + mouseHoverCell[0])
    }
    setFormattedText(dataDisplay, text)

    if ('flags' in internalInfo) {
      // we got ourselves some internal data
      let text = ' '
      text += ` flags:${internalInfo.flags.toString(2)}`
      text += ` curAttrs:${internalInfo.cursorAttrs.toString(2)}`
      text += ` Region:${internalInfo.regionStart}->${internalInfo.regionEnd}`
      text += ` Charset:${internalInfo.charsetGx} (0:${internalInfo.charsetG0},1:${internalInfo.charsetG1})`
      text += ` Heap:${internalInfo.freeHeap}`
      text += ` Clients:${internalInfo.clientCount}`
      setFormattedText(internalDisplay, text)
    }
  }

  screen.on('draw', updateToolbar)
  screen.on('internal', data => {
    internalInfo = data
    updateToolbar()
  })
}
