const { qs, mk } = require('../utils')
const Notify = require('../notif')
const TermScreen = require('./screen')
const TermConnection = require('./connection')
const TermInput = require('./input')
const TermUpload = require('./upload')
const initSoftKeyboard = require('./soft_keyboard')
const attachDebugScreen = require('./debug_screen')
const initButtons = require('./buttons')

/** Init the terminal sub-module - called from HTML */
module.exports = function (opts) {
  const screen = new TermScreen()
  const conn = new TermConnection(screen)
  const input = TermInput(conn, screen)
  const termUpload = TermUpload(conn, input, screen)
  screen.input = input
  screen.conn = conn
  input.termUpload = termUpload

  const buttons = initButtons(input)
  screen.on('button-labels', labels => {
    // TODO: don't use pointers for this
    buttons.labels.splice(0, buttons.labels.length, ...labels)
    buttons.update()
  })

  let showSplashTimeout = null
  let showSplash = (obj, delay = 250) => {
    clearTimeout(showSplashTimeout)
    showSplashTimeout = setTimeout(() => {
      screen.window.statusScreen = obj
    }, delay)
  }

  conn.on('open', () => {
    // console.log('*open')
    showSplash({ title: 'Connecting', loading: true })
  })
  conn.on('connect', () => {
    // console.log('*connect')
    showSplash({ title: 'Waiting for content', loading: true })
  })
  conn.on('load', () => {
    // console.log('*load')
    clearTimeout(showSplashTimeout)
    if (screen.window.statusScreen) screen.window.statusScreen = null
  })
  conn.on('disconnect', () => {
    // console.log('*disconnect')
    showSplash({ title: 'Disconnected' }, 500)
    screen.screen = []
    screen.screenFG = []
    screen.screenBG = []
    screen.screenAttrs = []
  })
  conn.on('silence', () => {
    // console.log('*silence')
    showSplash({ title: 'Waiting for server', loading: true }, 0)
  })
  // conn.on('ping-fail', () => { screen.window.statusScreen = { title: 'Disconnected' } })
  conn.on('ping-success', () => {
    // console.log('*ping-success')
    showSplash({ title: 'Re-connecting', loading: true }, 0)
  })

  conn.init()
  input.init(opts)
  termUpload.init()
  Notify.init()

  window.onerror = function (errorMsg, file, line, col) {
    Notify.show(`<b>JS ERROR!</b><br>${errorMsg}<br>at ${file}:${line}:${col}`, 10000, true)
    return false
  }

  qs('#screen').appendChild(screen.canvas)

  initSoftKeyboard(screen, input)
  if (attachDebugScreen) attachDebugScreen(screen)

  let fullscreenIcon = {} // dummy
  let isFullscreen = false
  let properFullscreen = false
  let fitScreen = false
  let screenPadding = screen.window.padding
  let fitScreenIfNeeded = function fitScreenIfNeeded () {
    if (isFullscreen) {
      fullscreenIcon.className = 'icn-resize-small'
      if (properFullscreen) {
        screen.window.fitIntoWidth = window.screen.width
        screen.window.fitIntoHeight = window.screen.height
        screen.window.padding = 0
      } else {
        screen.window.fitIntoWidth = window.innerWidth
        if (qs('#term-nav').classList.contains('hidden')) {
          screen.window.fitIntoHeight = window.innerHeight
        } else {
          screen.window.fitIntoHeight = window.innerHeight - 24
        }
        screen.window.padding = 0
      }
    } else {
      fullscreenIcon.className = 'icn-resize-full'
      screen.window.fitIntoWidth = fitScreen ? window.innerWidth - 4 : 0
      screen.window.fitIntoHeight = fitScreen ? window.innerHeight : 0
      screen.window.padding = screenPadding
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
  if (window.Element.prototype.requestFullscreen || window.Element.prototype.webkitRequestFullscreen) {
    properFullscreen = true

    let checkForFullscreen = function () {
      // document.fullscreenElement is not really supported yet, so here's a hack
      if (isFullscreen && (window.innerWidth !== window.screen.width || window.innerHeight !== window.screen.height)) {
        isFullscreen = false
        fitScreenIfNeeded()
      }
    }
    setInterval(checkForFullscreen, 500)
  }

  // (why are the buttons anchors?)
  let button = mk('a')
  button.id = 'fullscreen-button'
  button.href = '#'
  button.addEventListener('click', e => {
    e.preventDefault()

    if (document.body.classList.contains('pseudo-fullscreen')) {
      document.body.classList.remove('pseudo-fullscreen')
      isFullscreen = false
      fitScreenIfNeeded()
      return
    }

    isFullscreen = true
    fitScreenIfNeeded()
    screen.updateSize()

    if (properFullscreen) {
      if (screen.canvas.requestFullscreen) screen.canvas.requestFullscreen()
      else screen.canvas.webkitRequestFullscreen()
    } else {
      document.body.classList.add('pseudo-fullscreen')
    }
  })
  fullscreenIcon = mk('i')
  fullscreenIcon.className = 'icn-resize-full'
  button.appendChild(fullscreenIcon)
  let span = mk('span')
  span.textContent = 'Fullscreen'
  button.appendChild(span)
  qs('#term-nav').insertBefore(button, qs('#term-nav').firstChild)

  // for debugging
  window.termScreen = screen
  window.conn = conn
  window.input = input
  window.termUpl = termUpload
}
