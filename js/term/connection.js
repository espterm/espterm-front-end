const EventEmitter = require('events')
const $ = require('../lib/chibi')
let demo
try { demo = require('./demo') } catch (err) {}

const RECONN_DELAY = 2000
const HEARTBEAT_TIME = 3000

/** Handle connections */
module.exports = class TermConnection extends EventEmitter {
  constructor (screen) {
    super()

    this.screen = screen
    this.ws = null
    this.heartbeatTimeout = null
    this.pingInterval = null
    this.xoff = false
    this.autoXoffTimeout = null
    this.reconnTimeout = null
    this.forceClosing = false
    this.queue = []

    try {
      this.blobReader = new window.FileReader()
      this.blobReader.onload = (evt) => {
        this.onDecodedWSMessage(this.blobReader.result)
      }
      this.blobReader.onerror = (evt) => {
        console.error(evt)
      }
    } catch (e) {
      this.blobReader = null
    }

    this.pageShown = false

    this.disconnectTimeout = null

    document.addEventListener('visibilitychange', () => {
      if (document.hidden === true) {
        console.info('Window lost focus, freeing socket')
        // Delayed, avoid disconnecting if the background time is short
        this.disconnectTimeout = setTimeout(() => {
          this.closeSocket()
          clearTimeout(this.heartbeatTimeout)
        }, 1000)
      } else {
        clearTimeout(this.disconnectTimeout)
        console.info('Window got focus, re-connecting')
        this.init()
      }
    }, false)
  }

  onWSOpen (evt) {
    console.log('CONNECTED')
    this.heartbeat()
    this.send('i')
    this.forceClosing = false

    this.emit('connect')
  }

  onWSClose (evt) {
    if (this.forceClosing) {
      this.forceClosing = false
      return
    }
    console.warn('SOCKET CLOSED, code ' + evt.code + '. Reconnecting...')
    if (evt.code < 1000) {
      console.error('Bad code from socket!')
      // this sometimes happens for unknown reasons, code < 1000 is invalid
      // location.reload()
    }

    clearTimeout(this.reconnTimeout)
    this.reconnTimeout = setTimeout(() => this.init(), RECONN_DELAY)

    this.emit('disconnect', evt.code)
  }

  onDecodedWSMessage (str) {
    switch (str.charAt(0)) {
      case '.':
        // heartbeat, no-op message
        break

      case '-':
        // console.log('xoff');
        this.xoff = true
        this.autoXoffTimeout = setTimeout(() => {
          this.xoff = false
          this.flushQueue()
        }, 250)
        break

      case '+':
        // console.log('xon');
        this.xoff = false
        this.flushQueue()
        clearTimeout(this.autoXoffTimeout)
        break

      default:
        this.screen.load(str)
        if (!this.pageShown) {
          window.showPage()
          this.pageShown = true
        }
        break
    }
    this.heartbeat()
  }

  onWSMessage (evt) {
    if (typeof evt.data === 'string') this.onDecodedWSMessage(evt.data)
    else {
      if (!this.blobReader) {
        console.error('No FileReader!')
        return
      }

      if (this.blobReader.readyState !== 1) {
        this.blobReader.readAsText(evt.data)
      } else {
        setTimeout(() => {
          this.onWSMessage(evt)
        }, 1)
      }
    }
  }

  canSend () {
    return !this.xoff
  }

  send (message) {
    if (window._demo) {
      if (typeof window.demoInterface !== 'undefined') {
        demo.input(message)
      } else {
        console.log(`TX: ${JSON.stringify(message)}`)
      }
      return true // Simulate success
    }
    if (this.xoff) {
      console.log("Can't send, flood control. Queueing")
      this.queue.push(message)
      return false
    }

    if (!this.ws) return false // for dry testing
    if (this.ws.readyState !== 1) {
      console.error('Socket not ready')
      return false
    }
    if (typeof message !== 'string') {
      message = JSON.stringify(message)
    }
    this.ws.send(message)
    return true
  }

  flushQueue () {
    console.log('Flushing input queue')
    for (let message of this.queue) this.send(message)
    this.queue = []
  }

  /** Safely close the socket */
  closeSocket () {
    if (this.ws) {
      this.forceClosing = true
      if (this.ws.readyState === 1) this.ws.close()
      this.ws = null
    }
  }

  init () {
    if (window._demo) {
      if (typeof window.demoInterface === 'undefined') {
        window.alert('Demoing non-demo build!') // this will catch mistakes when deploying to the website
      } else {
        demo.init(this.screen)
      }
      return
    }

    clearTimeout(this.reconnTimeout)
    clearTimeout(this.heartbeatTimeout)

    this.closeSocket()

    this.ws = new window.WebSocket('ws://' + window._root + '/term/update.ws')
    this.ws.addEventListener('open', (...args) => this.onWSOpen(...args))
    this.ws.addEventListener('close', (...args) => this.onWSClose(...args))
    this.ws.addEventListener('message', (...args) => this.onWSMessage(...args))
    console.log('Opening socket.')
    this.heartbeat()

    this.emit('open')
  }

  heartbeat () {
    this.emit('heartbeat')
    clearTimeout(this.heartbeatTimeout)
    this.heartbeatTimeout = setTimeout(() => this.onHeartbeatFail(), HEARTBEAT_TIME)
  }

  sendPing () {
    console.log('> ping')
    this.emit('ping')
    $.get('http://' + window._root + '/api/v1/ping', (resp, status) => {
      if (status === 200) {
        clearInterval(this.pingInterval)
        console.info('Server ready, opening socket…')
        this.emit('ping-success')
        this.init()
        // location.reload()
      } else this.emit('ping-fail', status)
    }, {
      timeout: 100,
      loader: false // we have loader on-screen
    })
  }

  onHeartbeatFail () {
    this.closeSocket()
    this.emit('silence')
    console.error('Heartbeat lost, probing server...')
    clearInterval(this.pingInterval)
    this.pingInterval = setInterval(() => { this.sendPing() }, 1000)

    // first ping, if this gets through, it'll will reduce delay
    setTimeout(() => { this.sendPing() }, 200)
  }
}
