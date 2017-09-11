class ANSIParser {
  constructor (handler) {
    this.reset()
    this.handler = handler
    this.joinChunks = true
  }
  reset () {
    this.currentSequence = 0
    this.sequence = ''
  }
  parseSequence (sequence) {
    if (sequence[0] === '[') {
      let type = sequence[sequence.length - 1]
      let content = sequence.substring(1, sequence.length - 1)

      let numbers = content ? content.split(';').map(i => +i.replace(/\D/g, '')) : []
      let numOr1 = numbers.length ? numbers[0] : 1
      if (type === 'H') {
        this.handler('set-cursor', (numbers[0] | 0) - 1, (numbers[1] | 0) - 1)
      } else if (type >= 'A' && type <= 'D') {
        this.handler(`move-cursor-${type <= 'B' ? 'y' : 'x'}`, ((type === 'B' || type === 'C') ? 1 : -1) * numOr1)
      } else if (type === 'E' || type === 'F') {
        this.handler('move-cursor-line', (type === 'E' ? 1 : -1) * numOr1)
      } else if (type === 'G') {
        this.handler('set-cursor-x', numOr1 - 1)
      } else if (type === 'J') {
        let number = numbers.length ? numbers[0] : 2
        if (number === 2) this.handler('clear')
      } else if (type === 'P') {
        this.handler('delete', numOr1)
      } else if (type === '@') {
        this.handler('insert-blanks', numOr1)
      } else if (type === 'q') this.handler('set-cursor-style', numOr1)
      else if (type === 'm') {
        if (!numbers.length || numbers[0] === 0) {
          this.handler('reset-style')
          return
        }
        let type = numbers[0]
        if (type === 1) this.handler('set-attrs', 1) // bold
        else if (type === 2) this.handler('set-attrs', 1 << 1) // faint
        else if (type === 3) this.handler('set-attrs', 1 << 2) // italic
        else if (type === 4) this.handler('set-attrs', 1 << 3) // underline
        else if (type === 5 || type === 6) this.handler('set-attrs', 1 << 4) // blink
        else if (type === 7) this.handler('set-attrs', -1) // invert
        else if (type === 9) this.handler('set-attrs', 1 << 6) // strike
        else if (type === 20) this.handler('set-attrs', 1 << 5) // fraktur
        else if (type >= 30 && type <= 37) this.handler('set-color-fg', type % 10)
        else if (type >= 40 && type <= 47) this.handler('set-color-bg', type % 10)
        else if (type === 39) this.handler('set-color-fg', 7)
        else if (type === 49) this.handler('set-color-bg', 0)
        else if (type >= 90 && type <= 98) this.handler('set-color-fg', (type % 10) + 8)
        else if (type >= 100 && type <= 108) this.handler('set-color-bg', (type % 10) + 8)
        else if (type === 38 || type === 48) {
          if (numbers[1] === 5) {
            let color = (numbers[2] | 0) & 0xFF
            if (type === 38) this.handler('set-color-fg', color)
            if (type === 48) this.handler('set-color-bg', color)
          }
        }
      }
    }
  }
  write (text) {
    for (let character of text.toString()) {
      let code = character.codePointAt(0)
      if (code === 0x1b) this.currentSequence = 1
      else if (this.currentSequence === 1 && character === '[') {
        this.currentSequence = 2
        this.sequence += '['
      } else if (this.currentSequence && character.match(/[\x40-\x7e]/)) {
        this.parseSequence(this.sequence + character)
        this.currentSequence = 0
        this.sequence = ''
      } else if (this.currentSequence > 1) this.sequence += character
      else if (this.currentSequence === 1) {
        // something something nothing
        this.currentSequence = 0
        this.handler('write', character)
      } else if (code === 0x07) this.handler('bell')
      else if (code === 0x08) this.handler('back')
      else if (code === 0x0a) this.handler('new-line')
      else if (code === 0x0d) this.handler('return')
      else if (code === 0x15) this.handler('delete-line')
      else if (code === 0x17) this.handler('delete-word')
      else this.handler('write', character)
    }
    if (!this.joinChunks) this.reset()
  }
}
const TERM_DEFAULT_STYLE = 7
const TERM_MIN_DRAW_DELAY = 10

class ScrollingTerminal {
  constructor (screen) {
    this.width = 80
    this.height = 25
    this.termScreen = screen
    this.parser = new ANSIParser((...args) => this.handleParsed(...args))

    this.reset()

    this._lastLoad = Date.now()
    this.termScreen.load(this.serialize(), 0)
  }
  reset () {
    this.style = TERM_DEFAULT_STYLE
    this.cursor = { x: 0, y: 0, style: 1 }
    this.trackMouse = false
    this.parser.reset()
    this.clear()
  }
  clear () {
    this.screen = []
    for (let i = 0; i < this.width * this.height; i++) {
      this.screen.push([' ', this.style])
    }
  }
  scroll () {
    this.screen.splice(0, this.width)
    for (let i = 0; i < this.width; i++) {
      this.screen.push([' ', TERM_DEFAULT_STYLE])
    }
    this.cursor.y--
  }
  newLine () {
    this.cursor.y++
    if (this.cursor.y >= this.height) this.scroll()
  }
  writeChar (character) {
    this.screen[this.cursor.y * this.width + this.cursor.x] = [character, this.style]
    this.cursor.x++
    if (this.cursor.x >= this.width) {
      this.cursor.x = 0
      this.newLine()
    }
  }
  moveBack (n = 1) {
    for (let i = 0; i < n; i++) {
      this.cursor.x--
      if (this.cursor.x < 0) {
        if (this.cursor.y > 0) this.cursor.x = this.width - 1
        else this.cursor.x = 0
        this.cursor.y = Math.max(0, this.cursor.y - 1)
      }
    }
  }
  moveForward (n = 1) {
    for (let i = 0; i < n; i++) {
      this.cursor.x++
      if (this.cursor.x >= this.width) {
        this.cursor.x = 0
        this.cursor.y++
        if (this.cursor.y >= this.height) this.scroll()
      }
    }
  }
  deleteChar () {
    this.moveBack()
    this.screen.splice((this.cursor.y + 1) * this.width, 0, [' ', TERM_DEFAULT_STYLE])
    this.screen.splice(this.cursor.y * this.width + this.cursor.x, 1)
  }
  deleteForward (n) {
    n = Math.min(this.width, n)
    for (let i = 0; i < n; i++) this.screen.splice((this.cursor.y + 1) * this.width, 0, [' ', TERM_DEFAULT_STYLE])
    this.screen.splice(this.cursor.y * this.width + this.cursor.x, n)
  }
  clampCursor () {
    if (this.cursor.x < 0) this.cursor.x = 0
    if (this.cursor.y < 0) this.cursor.y = 0
    if (this.cursor.x > this.width - 1) this.cursor.x = this.width - 1
    if (this.cursor.y > this.height - 1) this.cursor.y = this.height - 1
  }
  handleParsed (action, ...args) {
    if (action === 'write') {
      this.writeChar(args[0])
    } else if (action === 'delete') {
      this.deleteForward(args[0])
    } else if (action === 'insert-blanks') {
      this.insertBlanks(args[0])
    } else if (action === 'clear') {
      this.clear()
    } else if (action === 'bell') {
      this.terminal.load('B')
    } else if (action === 'back') {
      this.moveBack()
    } else if (action === 'new-line') {
      this.newLine()
    } else if (action === 'return') {
      this.cursor.x = 0
    } else if (action === 'set-cursor') {
      this.cursor.x = args[0]
      this.cursor.y = args[1]
      this.clampCursor()
    } else if (action === 'move-cursor-y') {
      this.cursor.y += args[0]
      this.clampCursor()
    } else if (action === 'move-cursor-x') {
      this.cursor.x += args[0]
      this.clampCursor()
    } else if (action === 'move-cursor-line') {
      this.cursor.x = 0
      this.cursor.y += args[0]
      this.clampCursor()
    } else if (action === 'set-cursor-x') {
      this.cursor.x = args[0]
    } else if (action === 'set-cursor-style') {
      this.cursor.style = Math.max(0, Math.min(6, args[0]))
    } else if (action === 'reset-style') {
      this.style = TERM_DEFAULT_STYLE
    } else if (action === 'set-attrs') {
      if (args[0] === -1) {
        this.style = (this.style & 0xFF0000) | ((this.style >> 8) & 0xFF) | ((this.style & 0xFF) << 8)
      } else {
        this.style = (this.style & 0x00FFFF) | (args[0] << 16)
      }
    } else if (action === 'set-color-fg') {
      this.style = (this.style & 0xFFFF00) | args[0]
    } else if (action === 'set-color-bg') {
      this.style = (this.style & 0xFF00FF) | (args[0] << 8)
    }
  }
  write (text) {
    this.parser.write(text)
    this.scheduleLoad()
  }
  serialize () {
    let serialized = 'S'
    serialized += encode2B(this.height) + encode2B(this.width)
    serialized += encode2B(this.cursor.y) + encode2B(this.cursor.x)

    let attributes = 1 // cursor always visible
    attributes |= (3 << 5) * +this.trackMouse // track mouse controls both
    attributes |= 3 << 7 // buttons/links always visible
    attributes |= (this.cursor.style << 9)
    serialized += encode3B(attributes)

    let lastStyle = null
    for (let cell of this.screen) {
      if (cell[1] !== lastStyle) {
        let foreground = cell[1] & 0xFF
        let background = (cell[1] >> 8) & 0xFF
        let attributes = (cell[1] >> 16) & 0xFF
        let setForeground = foreground !== (lastStyle & 0xFF)
        let setBackground = background !== ((lastStyle >> 8) & 0xFF)
        let setAttributes = attributes !== ((lastStyle >> 16) & 0xFF)

        if (setForeground && setBackground) serialized += '\x03' + encode3B(cell[1] & 0xFFFF)
        else if (setForeground) serialized += '\x05' + encode2B(foreground)
        else if (setBackground) serialized += '\x06' + encode2B(background)
        if (setAttributes) serialized += '\x04' + encode2B(attributes)

        lastStyle = cell[1]
      }
      serialized += cell[0]
    }
    return serialized
  }
  scheduleLoad () {
    clearInterval(this._scheduledLoad)
    if (this._lastLoad < Date.now() - TERM_MIN_DRAW_DELAY) {
      this.termScreen.load(this.serialize())
    } else {
      this._scheduledLoad = setTimeout(() => {
        this.termScreen.load(this.serialize())
      }, TERM_MIN_DRAW_DELAY - this._lastLoad)
    }
  }
}

class Process {
  constructor (args) {
    // event listeners
    this._listeners = {}
  }
  on (event, listener) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push({ listener })
  }
  once (event, listener) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push({ listener, once: true })
  }
  off (event, listener) {
    let listeners = this._listeners[event]
    if (listeners) {
      for (let i in listeners) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1)
          break
        }
      }
    }
  }
  emit (event, ...args) {
    let listeners = this._listeners[event]
    if (listeners) {
      let remove = []
      for (let listener of listeners) {
        try {
          listener.listener(...args)
          if (listener.once) remove.push(listener)
        } catch (err) {
          console.error(err)
        }
      }
      for (let listener of remove) {
        listeners.splice(listeners.indexOf(listener), 1)
      }
    }
  }
  write (data) {
    this.emit('in', data)
  }
  destroy () {
    // death.
    this.emit('exit', 0)
  }
  run () {
    // noop
  }
}

let demoshIndex = {
  clear: class Clear extends Process {
    run () {
      this.emit('write', '\x1b[2J\x1b[1;1H')
      this.destroy()
    }
  },
  screenfetch: class Screenfetch extends Process {
    run () {
      let lines = [
        '\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m+\x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208mO\x1b[0m\x1b[38;5;203mS\x1b[0m\x1b[38;5;203m:\x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203mA\x1b[0m\x1b[38;5;198mr\x1b[0m\x1b[38;5;198mc\x1b[0m\x1b[38;5;198mh\x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199mL\x1b[0m\x1b[38;5;199mi\x1b[0m\x1b[38;5;163mn\x1b[0m\x1b[38;5;164mu\x1b[0m\x1b[38;5;164mx\x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128mx\x1b[0m\x1b[38;5;129m8\x1b[0m\x1b[38;5;129m6\x1b[0m\x1b[38;5;129m_\x1b[0m\x1b[38;5;93m6\x1b[0m\x1b[38;5;93m4\x1b[0m',
        '\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m#\x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203mH\x1b[0m\x1b[38;5;203mo\x1b[0m\x1b[38;5;198ms\x1b[0m\x1b[38;5;198mt\x1b[0m\x1b[38;5;198mn\x1b[0m\x1b[38;5;199ma\x1b[0m\x1b[38;5;199mm\x1b[0m\x1b[38;5;199me\x1b[0m\x1b[38;5;163m:\x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164mN\x1b[0m\x1b[38;5;164m2\x1b[0m\x1b[38;5;128m0\x1b[0m\x1b[38;5;129m2\x1b[0m',
        '\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m#\x1b[0m\x1b[38;5;154m#\x1b[0m\x1b[38;5;154m#\x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198mK\x1b[0m\x1b[38;5;198me\x1b[0m\x1b[38;5;199mr\x1b[0m\x1b[38;5;199mn\x1b[0m\x1b[38;5;199me\x1b[0m\x1b[38;5;163ml\x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164mR\x1b[0m\x1b[38;5;164me\x1b[0m\x1b[38;5;128ml\x1b[0m\x1b[38;5;129me\x1b[0m\x1b[38;5;129ma\x1b[0m\x1b[38;5;129ms\x1b[0m\x1b[38;5;93me\x1b[0m\x1b[38;5;93m:\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m4\x1b[0m\x1b[38;5;63m.\x1b[0m\x1b[38;5;63m9\x1b[0m\x1b[38;5;63m.\x1b[0m\x1b[38;5;33m4\x1b[0m\x1b[38;5;33m7\x1b[0m\x1b[38;5;33m-\x1b[0m\x1b[38;5;39m1\x1b[0m\x1b[38;5;39m-\x1b[0m\x1b[38;5;39ml\x1b[0m\x1b[38;5;38mt\x1b[0m\x1b[38;5;44ms\x1b[0m',
        '\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m#\x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199mU\x1b[0m\x1b[38;5;199mp\x1b[0m\x1b[38;5;163mt\x1b[0m\x1b[38;5;164mi\x1b[0m\x1b[38;5;164mm\x1b[0m\x1b[38;5;164me\x1b[0m\x1b[38;5;128m:\x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m1\x1b[0m\x1b[38;5;129m9\x1b[0m\x1b[38;5;93m:\x1b[0m\x1b[38;5;93m2\x1b[0m\x1b[38;5;93m6\x1b[0m',
        '\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;184m#\x1b[0m\x1b[38;5;214m#\x1b[0m\x1b[38;5;214m#\x1b[0m\x1b[38;5;214m#\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;163m \x1b[0m\x1b[38;5;164mW\x1b[0m\x1b[38;5;164mM\x1b[0m\x1b[38;5;164m:\x1b[0m\x1b[38;5;128m \x1b[0m\x1b[38;5;129mK\x1b[0m\x1b[38;5;129mW\x1b[0m\x1b[38;5;129mi\x1b[0m\x1b[38;5;93mn\x1b[0m',
        '\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m;\x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m#\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m;\x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;163m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128mD\x1b[0m\x1b[38;5;129mE\x1b[0m\x1b[38;5;129m:\x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;93mK\x1b[0m\x1b[38;5;93mD\x1b[0m\x1b[38;5;93mE\x1b[0m',
        '\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m+\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;208m.\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;163m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129mP\x1b[0m\x1b[38;5;93ma\x1b[0m\x1b[38;5;93mc\x1b[0m\x1b[38;5;93mk\x1b[0m\x1b[38;5;63ma\x1b[0m\x1b[38;5;63mg\x1b[0m\x1b[38;5;63me\x1b[0m\x1b[38;5;63ms\x1b[0m\x1b[38;5;33m:\x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m1\x1b[0m\x1b[38;5;39m8\x1b[0m\x1b[38;5;39m2\x1b[0m\x1b[38;5;39m1\x1b[0m',
        '\x1b[38;5;154m \x1b[0m\x1b[38;5;154m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m+\x1b[0m\x1b[38;5;208m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;163m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93mR\x1b[0m\x1b[38;5;63mA\x1b[0m\x1b[38;5;63mM\x1b[0m\x1b[38;5;63m:\x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m9\x1b[0m\x1b[38;5;33m2\x1b[0m\x1b[38;5;33m5\x1b[0m\x1b[38;5;39m6\x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39mM\x1b[0m\x1b[38;5;38mB\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m/\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m1\x1b[0m\x1b[38;5;49m5\x1b[0m\x1b[38;5;49m9\x1b[0m\x1b[38;5;49m9\x1b[0m\x1b[38;5;48m9\x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48mM\x1b[0m\x1b[38;5;83mB\x1b[0m',
        '\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;184m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m;\x1b[0m\x1b[38;5;128m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63mP\x1b[0m\x1b[38;5;63mr\x1b[0m\x1b[38;5;33mo\x1b[0m\x1b[38;5;33mc\x1b[0m\x1b[38;5;33me\x1b[0m\x1b[38;5;39ms\x1b[0m\x1b[38;5;39ms\x1b[0m\x1b[38;5;39mo\x1b[0m\x1b[38;5;38mr\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44mT\x1b[0m\x1b[38;5;44my\x1b[0m\x1b[38;5;43mp\x1b[0m\x1b[38;5;49me\x1b[0m\x1b[38;5;49m:\x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48mI\x1b[0m\x1b[38;5;48mn\x1b[0m\x1b[38;5;48mt\x1b[0m\x1b[38;5;83me\x1b[0m\x1b[38;5;83ml\x1b[0m\x1b[38;5;83m(\x1b[0m\x1b[38;5;83mR\x1b[0m\x1b[38;5;118m)\x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118mC\x1b[0m\x1b[38;5;154mo\x1b[0m\x1b[38;5;154mr\x1b[0m\x1b[38;5;154me\x1b[0m\x1b[38;5;148m(\x1b[0m\x1b[38;5;184mT\x1b[0m\x1b[38;5;184mM\x1b[0m\x1b[38;5;184m)\x1b[0m\x1b[38;5;178m \x1b[0m\x1b[38;5;214mi\x1b[0m\x1b[38;5;214m5\x1b[0m\x1b[38;5;214m-\x1b[0m\x1b[38;5;208m6\x1b[0m\x1b[38;5;208m4\x1b[0m\x1b[38;5;208m0\x1b[0m\x1b[38;5;203m0\x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203mC\x1b[0m\x1b[38;5;203mP\x1b[0m\x1b[38;5;198mU\x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m@\x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m2\x1b[0m\x1b[38;5;199m.\x1b[0m\x1b[38;5;163m8\x1b[0m\x1b[38;5;164m0\x1b[0m\x1b[38;5;164mG\x1b[0m\x1b[38;5;164mH\x1b[0m\x1b[38;5;128mz\x1b[0m',
        '\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;214m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;203m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;128m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m+\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m$\x1b[0m\x1b[38;5;33mE\x1b[0m\x1b[38;5;39mD\x1b[0m\x1b[38;5;39mI\x1b[0m\x1b[38;5;39mT\x1b[0m\x1b[38;5;38mO\x1b[0m\x1b[38;5;44mR\x1b[0m\x1b[38;5;44m:\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43mv\x1b[0m\x1b[38;5;49mi\x1b[0m\x1b[38;5;49mm\x1b[0m',
        '\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;208m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39mR\x1b[0m\x1b[38;5;39mo\x1b[0m\x1b[38;5;38mo\x1b[0m\x1b[38;5;44mt\x1b[0m\x1b[38;5;44m:\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m1\x1b[0m\x1b[38;5;49m6\x1b[0m\x1b[38;5;49m0\x1b[0m\x1b[38;5;49mG\x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m/\x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m1\x1b[0m\x1b[38;5;83m9\x1b[0m\x1b[38;5;83m6\x1b[0m\x1b[38;5;83mG\x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;118m(\x1b[0m\x1b[38;5;118m8\x1b[0m\x1b[38;5;154m1\x1b[0m\x1b[38;5;154m%\x1b[0m\x1b[38;5;154m)\x1b[0m\x1b[38;5;148m \x1b[0m\x1b[38;5;184m(\x1b[0m\x1b[38;5;184me\x1b[0m\x1b[38;5;184mx\x1b[0m\x1b[38;5;178mt\x1b[0m\x1b[38;5;214m4\x1b[0m\x1b[38;5;214m)\x1b[0m',
        '\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m.\x1b[0m\x1b[38;5;198m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m;\x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;93m;\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;63m#\x1b[0m\x1b[38;5;63m;\x1b[0m\x1b[38;5;63m`\x1b[0m\x1b[38;5;63m"\x1b[0m\x1b[38;5;33m.\x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;38m \x1b[0m',
        '\x1b[38;5;203m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;198m \x1b[0m\x1b[38;5;199m.\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;199m#\x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;128m#\x1b[0m\x1b[38;5;129m;\x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m;\x1b[0m\x1b[38;5;63m#\x1b[0m\x1b[38;5;63m#\x1b[0m\x1b[38;5;63m#\x1b[0m\x1b[38;5;33m#\x1b[0m\x1b[38;5;33m#\x1b[0m\x1b[38;5;33m.\x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;38m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m',
        '\x1b[38;5;198m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;199m \x1b[0m\x1b[38;5;163m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;128m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m.\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m.\x1b[0m\x1b[38;5;63m#\x1b[0m\x1b[38;5;33m#\x1b[0m\x1b[38;5;33m#\x1b[0m\x1b[38;5;33m#\x1b[0m\x1b[38;5;39m#\x1b[0m\x1b[38;5;39m#\x1b[0m\x1b[38;5;39m#\x1b[0m\x1b[38;5;38m#\x1b[0m\x1b[38;5;44m`\x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m',
        '\x1b[38;5;199m \x1b[0m\x1b[38;5;163m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;164m#\x1b[0m\x1b[38;5;128m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;93m\'\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m\'\x1b[0m\x1b[38;5;38m#\x1b[0m\x1b[38;5;44m#\x1b[0m\x1b[38;5;44m#\x1b[0m\x1b[38;5;44m#\x1b[0m\x1b[38;5;43m#\x1b[0m\x1b[38;5;49m#\x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m',
        '\x1b[38;5;164m \x1b[0m\x1b[38;5;164m \x1b[0m\x1b[38;5;128m;\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;38m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m \x1b[0m\x1b[38;5;49m#\x1b[0m\x1b[38;5;49m#\x1b[0m\x1b[38;5;49m#\x1b[0m\x1b[38;5;48m#\x1b[0m\x1b[38;5;48m;\x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m',
        '\x1b[38;5;129m \x1b[0m\x1b[38;5;129m \x1b[0m\x1b[38;5;129m#\x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m\'\x1b[0m\x1b[38;5;93m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;38m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m\'\x1b[0m\x1b[38;5;83m#\x1b[0m\x1b[38;5;83m#\x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m \x1b[0m',
        '\x1b[38;5;93m \x1b[0m\x1b[38;5;93m#\x1b[0m\x1b[38;5;93m\'\x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;63m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;33m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;39m \x1b[0m\x1b[38;5;38m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;44m \x1b[0m\x1b[38;5;43m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;49m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;48m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;83m \x1b[0m\x1b[38;5;118m`\x1b[0m\x1b[38;5;118m#\x1b[0m\x1b[38;5;118m \x1b[0m\x1b[38;5;154m \x1b[0m'
      ]

      let loop = () => {
        if (lines.length) setTimeout(loop, 50)
        else this.destroy()
        this.emit('write', lines.shift() + '\r\n')
      }
      loop()
    }
  },
  'local-echo': class LocalEcho extends Process {
    write (data) {
      this.emit('write', data)
    }
  }
}

class DemoShell {
  constructor (terminal) {
    this.terminal = terminal
    this.terminal.reset()
    this.parser = new ANSIParser((...args) => this.handleParsed(...args))
    this.prompt()
    this.input = ''
    this.cursorPos = 0
    this.child = null
    this.index = demoshIndex
  }
  write (text) {
    if (this.child) {
      if (text.codePointAt(0) === 3) this.child.destroy()
      else this.child.write(text)
    } else this.parser.write(text)
  }
  prompt (success = true) {
    if (this.terminal.cursor.x !== 0) this.terminal.write('\x1b[38;5;238m⏎\r\n')
    this.terminal.write('\x1b[34;1mdemosh \x1b[m')
    if (!success) this.terminal.write('\x1b[31m')
    this.terminal.write('$ \x1b[m')
    this.input = ''
    this.cursorPos = 0
  }
  handleParsed (action, ...args) {
    this.terminal.write('\b\x1b[P'.repeat(this.cursorPos))
    if (action === 'write') {
      this.input = this.input.substr(0, this.cursorPos) + args[0] + this.input.substr(this.cursorPos)
      this.cursorPos++
    } else if (action === 'back') {
      this.input = this.input.substr(0, this.cursorPos - 1) + this.input.substr(this.cursorPos)
      this.cursorPos--
      if (this.cursorPos < 0) this.cursorPos = 0
    } else if (action === 'move-cursor-x') {
      this.cursorPos = Math.max(0, Math.min(this.input.length, this.cursorPos + args[0]))
    } else if (action === 'delete-line') {
      this.input = ''
      this.cursorPos = 0
    } else if (action === 'delete-word') {
      let words = this.input.substr(0, this.cursorPos).split(' ')
      words.pop()
      this.input = words.join(' ') + this.input.substr(this.cursorPos)
      this.cursorPos = words.join(' ').length
    }

    this.terminal.write(this.input)
    this.terminal.write('\b'.repeat(this.input.length))
    this.terminal.moveForward(this.cursorPos)
    this.terminal.write('') // dummy. Apply the moveFoward

    if (action === 'return') {
      this.terminal.write('\r\n')
      this.parse(this.input)
    }
  }
  parse (input) {
    // TODO: basic chaining (i.e. semicolon)
    this.run(input)
  }
  run (command) {
    let parts = ['']

    let inQuote = false
    for (let character of command.trim()) {
      if (inQuote && character !== inQuote) {
        parts[parts.length - 1] += character
      } else if (inQuote) {
        inQuote = false
      } else if (character === '"' || character === "'") {
        inQuote = character
      } else if (character.match(/\s/)) {
        if (parts[parts.length - 1]) parts.push('')
      } else parts[parts.length - 1] += character
    }

    let name = parts.shift()
    if (name in this.index) {
      this.spawn(name, parts)
    } else {
      this.terminal.write(`demosh: Unknown command: ${name}\r\n`)
      this.prompt(false)
    }
  }
  spawn (name, args = []) {
    let Process = this.index[name]
    this.child = new Process(...args)
    let write = data => this.terminal.write(data)
    this.child.on('write', write)
    this.child.on('exit', code => {
      this.child.off('write', write)
      this.child = null
      this.prompt(!code)
    })
    this.child.run(...args)
  }
}

window.demoInterface = {
  input (data) {
    let type = data[0]
    let content = data.substr(1)

    if (type === 's') {
      this.shell.write(content)
    } else if (type === 'b') {
      let button = content.charCodeAt(0)
      console.log(`button ${button} pressed`)
    } else if (type === 'm' || type === 'p' || type === 'r') {
      console.log(JSON.stringify(data))
    }
  },
  init (screen) {
    this.terminal = new ScrollingTerminal(screen)
    this.shell = new DemoShell(this.terminal)
  }
}
