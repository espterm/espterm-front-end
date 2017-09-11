/** Init the terminal sub-module - called from HTML */
window.termInit = function (labels, theme) {
  const screen = new window.TermScreen()
  const conn = window.Conn(screen)
  const input = window.Input(conn)
  const termUpload = window.TermUpl(conn, input)

  screen.input = input

  conn.init()
  input.init()
  termUpload.init()

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

  window.toggleFitScreen = function () {
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

  window.openTermUpl = () => termUpload.open()
  window.startTermUpl = () => termUpload.start()
  window.closeTermUpl = () => termUpload.close()

  // for debugging
  window.termScreen = screen
  window.conn = conn
  window.input = input
  window.termUpl = termUpload
}
