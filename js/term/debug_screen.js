const { mk } = require('../utils')

module.exports = function attachDebugScreen (screen) {
  const debugCanvas = mk('canvas')
  const ctx = debugCanvas.getContext('2d')

  debugCanvas.classList.add('debug-canvas')

  let mouseHoverCell = null
  let updateToolbar

  let onMouseMove = e => {
    mouseHoverCell = screen.screenToGrid(e.offsetX, e.offsetY)
    startDrawing()
    updateToolbar()
  }
  let onMouseOut = () => (mouseHoverCell = null)

  let addCanvas = function () {
    if (!debugCanvas.parentNode) {
      screen.canvas.parentNode.appendChild(debugCanvas)
      screen.canvas.parentNode.addEventListener('mousemove', onMouseMove)
      screen.canvas.parentNode.addEventListener('mouseout', onMouseOut)
    }
  }
  let removeCanvas = function () {
    if (debugCanvas.parentNode) {
      debugCanvas.parentNode.removeChild(debugCanvas)
      screen.canvas.parentNode.removeEventListener('mousemove', onMouseMove)
      screen.canvas.parentNode.removeEventListener('mouseout', onMouseOut)
      onMouseOut()
    }
  }
  let updateCanvasSize = function () {
    let { width, height, devicePixelRatio } = screen.window
    let cellSize = screen.getCellSize()
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

  screen._debug = {
    drawStart (reason) {
      lastReason = reason
      startTime = Date.now()
      clippedRects = []
    },
    drawEnd () {
      endTime = Date.now()
      console.log(drawInfo.textContent = `Draw: ${lastReason} (${(endTime - startTime)} ms) with graphics=${screen.window.graphics}`)
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

    let { devicePixelRatio, width, height } = screen.window
    let { width: cellWidth, height: cellHeight } = screen.getCellSize()
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
  const dataDisplay = mk('div')
  dataDisplay.classList.add('data-display')
  toolbar.appendChild(dataDisplay)
  toolbar.appendChild(drawInfo)
  const buttons = mk('div')
  buttons.classList.add('toolbar-buttons')
  toolbar.appendChild(buttons)

  {
    const redraw = mk('button')
    redraw.textContent = 'Redraw'
    redraw.addEventListener('click', e => {
      screen.renderer.resetDrawn()
      screen.renderer.draw('debug-redraw')
    })
    buttons.appendChild(redraw)

    const fancyGraphics = mk('button')
    fancyGraphics.textContent = 'Toggle Graphics'
    fancyGraphics.addEventListener('click', e => {
      screen.window.graphics = +!screen.window.graphics
    })
    buttons.appendChild(fancyGraphics)
  }

  const attachToolbar = function () {
    screen.canvas.parentNode.appendChild(toolbar)
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

  const formatColor = color => color < 256 ? color : `#${`000000${(color - 256).toString(16)}`.substr(-6)}`
  const getCellData = cell => {
    if (cell < 0 || cell > screen.screen.length) return '(-)'
    let cellAttrs = screen.renderer.drawnScreenAttrs[cell]
    let cellFG = formatColor(screen.renderer.drawnScreenFG[cell])
    let cellBG = formatColor(screen.renderer.drawnScreenBG[cell])
    let cellCode = (screen.renderer.drawnScreen[cell] || '').codePointAt(0)
    let hexcode = cellCode.toString(16).toUpperCase()
    if (hexcode.length < 4) hexcode = `0000${hexcode}`.substr(-4)
    hexcode = `U+${hexcode}`
    let x = cell % screen.window.width
    let y = Math.floor(cell / screen.window.width)
    return `((${y},${x})=${cell}:${hexcode}:F${cellFG}:B${cellBG}:A${cellAttrs.toString(2)})`
  }

  let internalInfo = {}

  updateToolbar = () => {
    if (!toolbarAttached) return
    let text = `C((${screen.cursor.y},${screen.cursor.x}),hang:${screen.cursor.hanging},vis:${screen.cursor.visible})`
    if (mouseHoverCell) {
      text += ' m' + getCellData(mouseHoverCell[1] * screen.window.width + mouseHoverCell[0])
    }
    if ('flags' in internalInfo) {
      // we got ourselves some internal data
      text += ' '
      text += ` flags:${internalInfo.flags}`
      text += ` curAttrs:${internalInfo.cursorAttrs}`
      text += ` Region:${internalInfo.regionStart}->${internalInfo.regionEnd}`
      text += ` Charset:${internalInfo.charsetGx} (0:${internalInfo.charsetG0},1:${internalInfo.charsetG1})`
      text += ` Heap:${internalInfo.freeHeap}`
      text += ` Clients:${internalInfo.clientCount}`
    }
    dataDisplay.textContent = text
  }

  screen.on('draw', updateToolbar)
  screen.on('internal', data => {
    internalInfo = data
    updateToolbar()
  })
}
