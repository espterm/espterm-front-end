/** Init the terminal sub-module - called from HTML */
window.termInit = function (labels, theme) {
  const screen = new TermScreen()
  const conn = Conn(screen)
  const input = Input(conn)
  const termUpload = TermUpl(conn, input)

  screen.input = input

  conn.init()
  input.init()
  termUpload.init()
  Notify.init()

  window.onerror = function (errorMsg, file, line, col) {
    Notify.show(`<b>JS ERROR!</b><br>${errorMsg}<br>at ${file}:${line}:${col}`, 10000, true)
    return false
  }

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
  }

  window.initSoftKeyboard(screen, input)
  if (window.attachDebugScreen) window.attachDebugScreen(screen)

  // for debugging
  window.termScreen = screen
  window.conn = conn
  window.input = input
  window.termUpl = termUpload
}
