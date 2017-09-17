window.attachDebugScreen = function (screen) {
  const debugCanvas = mk('canvas')
  const ctx = debugCanvas.getContext('2d')

  debugCanvas.style.position = 'absolute'
  // hackity hack should probably set this in CSS
  debugCanvas.style.top = '6px'
  debugCanvas.style.left = '6px'
  debugCanvas.style.pointerEvents = 'none'

  let addCanvas = function () {
    if (!debugCanvas.parentNode) screen.canvas.parentNode.appendChild(debugCanvas)
  }
  let removeCanvas = function () {
    if (debugCanvas.parentNode) debugCanvas.parentNode.removeChild(debugCanvas)
  }
  let updateCanvasSize = function () {
    let { width, height, devicePixelRatio } = screen.window
    let cellSize = screen.getCellSize()
    debugCanvas.width = width * cellSize.width * devicePixelRatio
    debugCanvas.height = height * cellSize.height * devicePixelRatio
    debugCanvas.style.width = `${width * cellSize.width}px`
    debugCanvas.style.height = `${height * cellSize.height}px`
  }

  let startTime, endTime, lastReason
  let cells = new Map()
  let clippedRects = []

  let startDrawing

  screen._debug = {
    drawStart (reason) {
      lastReason = reason
      startTime = Date.now()
      clippedRects = []
    },
    drawEnd () {
      endTime = Date.now()
      console.log(`Draw: ${lastReason} (${(endTime - startTime)} ms) with fancy graphics: ${screen.window.graphics}`)
      startDrawing()
    },
    setCell (cell, flags) {
      cells.set(cell, [flags, Date.now()])
    },
    clipRect (...args) {
      clippedRects.push(args)
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

  let drawLoop = function () {
    if (isDrawing) requestAnimationFrame(drawLoop)

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

    if (activeCells === 0) {
      isDrawing = false
      removeCanvas()
    }
  }

  startDrawing = function () {
    if (isDrawing) return
    addCanvas()
    updateCanvasSize()
    isDrawing = true
    drawLoop()
  }
}
