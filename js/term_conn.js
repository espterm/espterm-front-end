/** Handle connections */
window.Conn = class TermConnection extends EventEmitter {
  constructor (screen) {
    super()

    this.screen = screen
    this.ws = null
    this.heartbeatTimeout = null
    this.pingInterval = null
    this.xoff = false
    this.autoXoffTimeout = null
    this.reconTimeout = null

    this.pageShown = false
  }

  onWSOpen (evt) {
    console.log('CONNECTED')
    this.heartbeat()
    this.send('i')

    this.emit('open')
  }

  onWSClose (evt) {
    console.warn('SOCKET CLOSED, code ' + evt.code + '. Reconnecting...')
    clearTimeout(this.reconTimeout)
    this.reconTimeout = setTimeout(() => this.init(), 2000)
    // this happens when the buffer gets fucked up via invalid unicode.
    // we basically use polling instead of socket then

    this.emit('close', evt.code)
  }

  onWSMessage (evt) {
    try {
      // . = heartbeat
      switch (evt.data.charAt(0)) {
        case '.':
          // heartbeat, no-op message
          break

        case '-':
          // console.log('xoff');
          this.xoff = true
          this.autoXoffTimeout = setTimeout(() => {
            this.xoff = false
          }, 250)
          break

        case '+':
          // console.log('xon');
          this.xoff = false
          clearTimeout(this.autoXoffTimeout)
          break

        default:
          this.screen.load(evt.data)
          if (!this.pageShown) {
            showPage()
            this.pageShown = true
          }
          break
      }
      this.heartbeat()
    } catch (e) {
      console.error(e)
    }
  }

  canSend () {
    return !this.xoff
  }

  send (message) {
    if (window._demo) {
      if (typeof window.demoInterface !== 'undefined') {
        demoInterface.input(message)
      } else {
        console.log(`TX: ${JSON.stringify(message)}`)
      }
      return true // Simulate success
    }
    if (this.xoff) {
      // TODO queue
      console.log("Can't send, flood control.")
      return false
    }

    if (!this.ws) return false // for dry testing
    if (this.ws.readyState !== 1) {
      console.error('Socket not ready')
      return false
    }
    if (typeof message != 'string') {
      message = JSON.stringify(message)
    }
    this.ws.send(message)
    return true
  }

  init () {
    if (window._demo) {
      if (typeof window.demoInterface === 'undefined') {
        alert('Demoing non-demo demo!') // this will catch mistakes when deploying to the website
      } else {
        demoInterface.init(screen)
        showPage()
      }
      return
    }

    clearTimeout(this.reconTimeout)
    clearTimeout(this.heartbeatTimeout)

    this.ws = new WebSocket('ws://' + _root + '/term/update.ws')
    this.ws.addEventListener('open', (...args) => this.onWSOpen(...args))
    this.ws.addEventListener('close', (...args) => this.onWSClose(...args))
    this.ws.addEventListener('message', (...args) => this.onWSMessage(...args))
    console.log('Opening socket.')
    this.heartbeat()

    this.emit('connect')
  }

  heartbeat () {
    clearTimeout(this.heartbeatTimeout)
    this.heartbeatTimeout = setTimeout(() => this.onHeartbeatFail(), 2000)
  }

  onHeartbeatFail () {
    console.error('Heartbeat lost, probing server...')
    clearInterval(this.pingInterval)
    this.pingInterval = setInterval(() => {
      console.log('> ping')
      this.emit('ping')
      $.get('http://' + _root + '/system/ping', (resp, status) => {
        if (status === 200) {
          clearInterval(this.pingInterval)
          console.info('Server ready, reloading page...')
          this.emit('ping-success')
          location.reload()
        } else this.emit('ping-fail', status)
      }, {
        timeout: 100
      })
    }, 1000)
  }
}
