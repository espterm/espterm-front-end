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

  {
    let fitScreen = false
    let fitScreenIfNeeded = function fitScreenIfNeeded () {
      screen.window.fitIntoWidth = fitScreen ? window.innerWidth - 20 : 0
      screen.window.fitIntoHeight = fitScreen ? window.innerHeight : 0
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
  }

  window.initSoftKeyboard(screen, input)
  if (window.attachDebugScreen) window.attachDebugScreen(screen)

  // for debugging
  window.termScreen = screen
  window.conn = conn
  window.input = input
  window.termUpl = termUpload
}
