const { getColor } = require('./themes')

module.exports = function attachDebugger (screen, connection) {
  const debugCanvas = document.createElement('canvas')
  debugCanvas.classList.add('debug-canvas')
  const ctx = debugCanvas.getContext('2d')

  const toolbar = document.createElement('div')
  toolbar.classList.add('debug-toolbar')

  const tooltip = document.createElement('div')
  tooltip.classList.add('debug-tooltip')

  let updateTooltip

  let selectedCell = null
  let mousePosition = null
  const onMouseMove = (e) => {
    if (e.target !== screen.layout.canvas) {
      selectedCell = null
      return
    }
    selectedCell = screen.layout.screenToGrid(e.offsetX, e.offsetY)
    mousePosition = [e.offsetX, e.offsetY]
    updateTooltip()
  }
  const onMouseOut = (e) => {
    selectedCell = null
  }

  const updateCanvasSize = function () {
    let { width, height, devicePixelRatio } = screen.layout.window
    let cellSize = screen.layout.getCellSize()
    let padding = Math.round(screen.layout._padding)
    debugCanvas.width = (width * cellSize.width + 2 * padding) * devicePixelRatio
    debugCanvas.height = (height * cellSize.height + 2 * padding) * devicePixelRatio
    debugCanvas.style.width = `${width * cellSize.width + 2 * screen.layout._padding}px`
    debugCanvas.style.height = `${height * cellSize.height + 2 * screen.layout._padding}px`
  }

  let startDrawLoop
  let screenAttached = false
  let eventNode
  const setScreenAttached = function (attached) {
    if (attached && !debugCanvas.parentNode) {
      screen.layout.canvas.parentNode.appendChild(debugCanvas)
      eventNode = debugCanvas.parentNode
      eventNode.addEventListener('mousemove', onMouseMove)
      eventNode.addEventListener('mouseout', onMouseOut)
      screen.layout.on('size-update', updateCanvasSize)
      updateCanvasSize()
      screenAttached = true
      startDrawLoop()
    } else if (!attached && debugCanvas.parentNode) {
      debugCanvas.parentNode.removeChild(debugCanvas)
      eventNode.removeEventListener('mousemove', onMouseMove)
      eventNode.removeEventListener('mouseout', onMouseOut)
      screen.layout.removeListener('size-update', updateCanvasSize)
      screenAttached = false
    }
  }

  const setToolbarAttached = function (attached) {
    if (attached && !toolbar.parentNode) {
      screen.layout.canvas.parentNode.appendChild(toolbar)
      screen.layout.canvas.parentNode.appendChild(tooltip)
    } else if (!attached && toolbar.parentNode) {
      screen.layout.canvas.parentNode.removeChild(toolbar)
      screen.layout.canvas.parentNode.removeChild(tooltip)
    }
  }

  screen.on('update-window:debug', enabled => {
    setToolbarAttached(enabled)
  })

  screen.layout.on('update-window:debug', enabled => {
    setScreenAttached(enabled)
  })

  let drawData = {
    reason: '',
    startTime: 0,
    endTime: 0,
    clipped: [],
    frames: [],
    cells: new Map()
  }

  screen._debug = screen.layout.renderer._debug = {
    drawStart (reason) {
      drawData.reason = reason
      drawData.startTime = window.performance.now()
    },
    drawEnd () {
      drawData.endTime = window.performance.now()
    },
    setCell (cell, flags) {
      drawData.cells.set(cell, [flags, window.performance.now()])
    },
    pushFrame (frame) {
      drawData.frames.push([...frame, window.performance.now()])
    }
  }

  let isDrawing = false
  let drawLoop = function () {
    if (screenAttached) window.requestAnimationFrame(drawLoop)
    else isDrawing = false

    let now = window.performance.now()

    let { width, height, devicePixelRatio } = screen.layout.window
    let padding = Math.round(screen.layout._padding)
    let cellSize = screen.layout.getCellSize()

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, width * cellSize.width + 2 * padding, height * cellSize.height + 2 * padding)
    ctx.translate(padding, padding)

    ctx.lineWidth = 2
    ctx.lineJoin = 'round'

    const cells = drawData.cells
    for (let cell = 0; cell < width * height; cell++) {
      // cell does not exist or has no flags set
      if (!cells.has(cell) || cells.get(cell)[0] === 0) continue

      const [flags, timestamp] = cells.get(cell)
      let elapsedTime = (now - timestamp) / 1000

      if (elapsedTime > 1) {
        cells.delete(cell)
        continue
      }

      ctx.globalAlpha = 0.5 * Math.max(0, 1 - elapsedTime)

      let x = cell % width
      let y = Math.floor(cell / width)

      if (flags & 2) {
        // updated
        ctx.fillStyle = '#0f0'
      } else if (flags & 1) {
        // redrawn
        ctx.fillStyle = '#f0f'
      }

      if (!(flags & 4)) {
        // outside a clipped region
        ctx.fillStyle = '#0ff'
      }

      ctx.fillRect(x * cellSize.width, y * cellSize.height, cellSize.width, cellSize.height)

      if (flags & 8) {
        // wide cell
        ctx.strokeStyle = '#f00'
        ctx.beginPath()
        ctx.moveTo(x * cellSize.width, (y + 1) * cellSize.height)
        ctx.lineTo((x + 1) * cellSize.width, (y + 1) * cellSize.height)
        ctx.stroke()
      }
    }

    let framesToDelete = []
    for (let frame of drawData.frames) {
      let timestamp = frame[4]
      let elapsedTime = (now - timestamp) / 1000
      if (elapsedTime > 1) framesToDelete.push(frame)
      else {
        ctx.globalAlpha = 1 - elapsedTime
        ctx.strokeStyle = '#ff0'
        ctx.strokeRect(frame[0] * cellSize.width, frame[1] * cellSize.height,
          frame[2] * cellSize.width, frame[3] * cellSize.height)
      }
    }
    for (let frame of framesToDelete) {
      drawData.frames.splice(drawData.frames.indexOf(frame), 1)
    }

    if (selectedCell !== null) {
      let [x, y] = selectedCell

      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 1

      // draw X line
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize.height)
      ctx.lineTo(x * cellSize.width, y * cellSize.height)
      ctx.strokeStyle = '#f00'
      ctx.setLineDash([cellSize.width])
      ctx.stroke()

      // draw Y line
      ctx.beginPath()
      ctx.moveTo(x * cellSize.width, 0)
      ctx.lineTo(x * cellSize.width, y * cellSize.height)
      ctx.strokeStyle = '#0f0'
      ctx.setLineDash([cellSize.height])
      ctx.stroke()

      ctx.globalAlpha = 1
      ctx.lineWidth = 1 + 0.5 * Math.sin((now / 1000) * 10)
      ctx.strokeStyle = '#fff'
      ctx.lineJoin = 'round'
      ctx.setLineDash([2, 2])
      ctx.lineDashOffset = (now / 1000) * 10
      ctx.strokeRect(x * cellSize.width, y * cellSize.height, cellSize.width, cellSize.height)
      ctx.lineDashOffset += 2
      ctx.strokeStyle = '#000'
      ctx.strokeRect(x * cellSize.width, y * cellSize.height, cellSize.width, cellSize.height)
      ctx.restore()
    }
  }
  startDrawLoop = function () {
    if (isDrawing) return
    isDrawing = true
    drawLoop()
  }

  // tooltip
  updateTooltip = function () {
    tooltip.innerHTML = ''
    let cell = selectedCell[1] * screen.window.width + selectedCell[0]
    if (!screen.screen[cell]) return

    let foreground = document.createElement('span')
    foreground.textContent = screen.screenFG[cell]
    let preview = document.createElement('span')
    preview.textContent = ' ●'
    preview.style.color = getColor(screen.screenFG[cell], screen.layout.renderer.palette)
    foreground.appendChild(preview)

    let background = document.createElement('span')
    background.textContent = screen.screenBG[cell]
    let bgPreview = document.createElement('span')
    bgPreview.textContent = ' ●'
    bgPreview.style.color = getColor(screen.screenBG[cell], screen.layout.renderer.palette)
    background.appendChild(bgPreview)

    let character = screen.screen[cell]
    let codePoint = character.codePointAt(0)
    let formattedCodePoint = codePoint.toString(16).length <= 4
      ? `0000${codePoint.toString(16)}`.substr(-4)
      : codePoint.toString(16)

    let data = {
      Foreground: foreground,
      Background: background,
      Character: `U+${formattedCodePoint}`
    }

    let table = document.createElement('table')

    for (let name in data) {
      let row = document.createElement('tr')
      let label = document.createElement('td')
      label.appendChild(new window.Text(name))
      label.classList.add('label')

      let value = document.createElement('td')
      value.appendChild(typeof data[name] === 'string' ? new window.Text(data[name]) : data[name])
      value.classList.add('value')

      row.appendChild(label)
      row.appendChild(value)
      table.appendChild(row)
    }

    tooltip.appendChild(table)

    tooltip.style.transform = `translate(${mousePosition.map(x => x + 'px').join(',')})`
  }
}
