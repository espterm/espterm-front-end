/** Init the terminal sub-module - called from HTML */
window.termInit = function (opts) {
  let { labels, theme, allFn } = opts

  const screen = new TermScreen()
  const conn = Conn(screen)
  const input = Input(conn)
  const termUpload = TermUpl(conn, input, screen)
  screen.input = input

  conn.init()
  input.init({ allFn })
  termUpload.init()
  Notify.init()

  window.onerror = function (errorMsg, file, line, col) {
    Notify.show(`<b>JS ERROR!</b><br>${errorMsg}<br>at ${file}:${line}:${col}`, 10000, true)
    return false
  }

  qs('#screen').appendChild(screen.canvas)
  screen.load(labels, theme) // load labels and theme

  window.initSoftKeyboard(screen, input)
  if (window.attachDebugScreen) window.attachDebugScreen(screen)

  let isFullscreen = false
  let fitScreen = false
  let fitScreenIfNeeded = function fitScreenIfNeeded () {
    if (isFullscreen) {
      screen.window.fitIntoWidth = window.screen.width
      screen.window.fitIntoHeight = window.screen.height
    } else {
      screen.window.fitIntoWidth = fitScreen ? window.innerWidth - 20 : 0
      screen.window.fitIntoHeight = fitScreen ? window.innerHeight : 0
    }
  }
  fitScreenIfNeeded()
  window.addEventListener('resize', fitScreenIfNeeded)

  let toggleFitScreen = function () {
    fitScreen = !fitScreen
    const resizeButtonIcon = qs('#resize-button-icon')
    if (fitScreen) {
      resizeButtonIcon.classList.remove('icn-resize-small')
      resizeButtonIcon.classList.add('icn-resize-full')
    } else {
      resizeButtonIcon.classList.remove('icn-resize-full')
      resizeButtonIcon.classList.add('icn-resize-small')
    }
    fitScreenIfNeeded()
  }

  qs('#term-fit-screen').addEventListener('click', function () {
    toggleFitScreen()
    return false
  })

  // add fullscreen mode & button
  if (Element.prototype.requestFullscreen || Element.prototype.webkitRequestFullscreen) {
    let checkForFullscreen = function () {
      // document.fullscreenElement is not really supported yet, so here's a hack
      if (isFullscreen && (innerWidth !== window.screen.width || innerHeight !== window.screen.height)) {
        isFullscreen = false
        fitScreenIfNeeded()
      }
    }
    setInterval(checkForFullscreen, 500)

    // (why are the buttons anchors?)
    let button = mk('a')
    button.href = '#'
    button.addEventListener('click', e => {
      e.preventDefault()

      isFullscreen = true
      fitScreenIfNeeded()
      screen.updateSize()

      if (screen.canvas.requestFullscreen) screen.canvas.requestFullscreen()
      else screen.canvas.webkitRequestFullscreen()
    })
    let icon = mk('i')
    icon.classList.add('icn-resize-full') // TODO: less confusing icons
    button.appendChild(icon)
    let span = mk('span')
    span.textContent = 'Fullscreen'
    button.appendChild(span)
    qs('#term-nav').insertBefore(button, qs('#term-nav').firstChild)
  }

  // for debugging
  window.termScreen = screen
  window.conn = conn
  window.input = input
  window.termUpl = termUpload
}
