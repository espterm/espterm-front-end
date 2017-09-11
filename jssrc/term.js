/** Init the terminal sub-module - called from HTML */
window.termInit = function (labels, theme) {
  Conn.init()
  Input.init()
  TermUpl.init()

  const screen = new window.TermScreen()

  let didNotifyAboutScreen = false
  Object.defineProperty(window, 'Screen', {
    get () {
      if (!didNotifyAboutScreen) {
        console.warn('Use local variables instead of window.Screen')
        didNotifyAboutScreen = true
      }
      return screen
    }
  })

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

  window.initSoftKeyboard(screen)
  if (window.attachDebugScreen) window.attachDebugScreen(screen)

  window.termScreen = screen // for debugging
}
