const EventEmitter = require('events')
const { encode2B, encode3B, parse2B } = require('../utils')
const { themes } = require('./themes')

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
        if (type === 1) this.handler('add-attrs', 1) // bold
        else if (type === 2) this.handler('add-attrs', 1 << 1) // faint
        else if (type === 3) this.handler('add-attrs', 1 << 2) // italic
        else if (type === 4) this.handler('add-attrs', 1 << 3) // underline
        else if (type === 5 || type === 6) this.handler('add-attrs', 1 << 4) // blink
        else if (type === 7) this.handler('add-attrs', -1) // invert
        else if (type === 9) this.handler('add-attrs', 1 << 6) // strike
        else if (type === 20) this.handler('add-attrs', 1 << 5) // fraktur
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
      } else if (type === 'h' || type === 'l') {
        if (content === '?25') {
          if (type === 'h') this.handler('show-cursor')
          else if (type === 'l') this.handler('hide-cursor')
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
      } else if (code < 0x03) this.handler('_null')
      else if (code === 0x03) this.handler('sigint')
      else if (code <= 0x06) this.handler('_null')
      else if (code === 0x07) this.handler('bell')
      else if (code === 0x08) this.handler('back')
      else if (code === 0x09) this.handler('tab')
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

let getRainbowColor = t => {
  let r = Math.floor(Math.sin(t) * 2.5 + 2.5)
  let g = Math.floor(Math.sin(t + 2 / 3 * Math.PI) * 2.5 + 2.5)
  let b = Math.floor(Math.sin(t + 4 / 3 * Math.PI) * 2.5 + 2.5)
  return 16 + 36 * r + 6 * g + b
}

class ScrollingTerminal {
  constructor (screen) {
    this.width = 80
    this.height = 25
    this.termScreen = screen
    this.parser = new ANSIParser((...args) => this.handleParsed(...args))

    this.reset()

    this._lastLoad = Date.now()
    this.termScreen.load(this.serialize())

    window.showPage()
  }
  reset () {
    this.style = TERM_DEFAULT_STYLE
    this.cursor = { x: 0, y: 0, style: 1, visible: true }
    this.trackMouse = false
    this.theme = -1
    this.rainbow = false
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
  deleteChar () {  // FIXME unused?
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
      this.insertBlanks(args[0]) // FIXME undefined?
    } else if (action === 'clear') {
      this.clear()
    } else if (action === 'bell') {
      this.termScreen.load('B')
    } else if (action === 'back') {
      this.moveBack()
    } else if (action === 'new-line') {
      this.newLine()
    } else if (action === 'return') {
      this.cursor.x = 0
    } else if (action === 'set-cursor') {
      this.cursor.x = args[1]
      this.cursor.y = args[0]
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
    } else if (action === 'add-attrs') {
      if (args[0] === -1) {
        this.style = (this.style & 0xFF0000) | ((this.style >> 8) & 0xFF) | ((this.style & 0xFF) << 8)
      } else {
        this.style |= (args[0] << 16)
      }
    } else if (action === 'set-color-fg') {
      this.style = (this.style & 0xFFFF00) | args[0]
    } else if (action === 'set-color-bg') {
      this.style = (this.style & 0xFF00FF) | (args[0] << 8)
    } else if (action === 'hide-cursor') {
      this.cursor.visible = false
    } else if (action === 'show-cursor') {
      this.cursor.visible = true
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

    let attributes = +this.cursor.visible
    attributes |= (3 << 5) * +this.trackMouse // track mouse controls both
    attributes |= 3 << 7 // buttons/links always visible
    attributes |= (this.cursor.style << 9)
    serialized += encode3B(attributes)

    let lastStyle = null
    let index = 0
    for (let cell of this.screen) {
      let style = cell[1]
      if (this.rainbow) {
        let x = index % this.width
        let y = Math.floor(index / this.width)
        style = (style & 0xFF0000) | getRainbowColor((x + y) / 10 + Date.now() / 1000)
        index++
      }
      if (style !== lastStyle) {
        let foreground = style & 0xFF
        let background = (style >> 8) & 0xFF
        let attributes = (style >> 16) & 0xFF
        let setForeground = foreground !== (lastStyle & 0xFF)
        let setBackground = background !== ((lastStyle >> 8) & 0xFF)
        let setAttributes = attributes !== ((lastStyle >> 16) & 0xFF)

        if (setForeground && setBackground) serialized += '\x03' + encode3B(style & 0xFFFF)
        else if (setForeground) serialized += '\x05' + encode2B(foreground)
        else if (setBackground) serialized += '\x06' + encode2B(background)
        if (setAttributes) serialized += '\x04' + encode2B(attributes)
        lastStyle = style
      }
      serialized += cell[0]
    }
    return serialized
  }
  scheduleLoad () {
    clearTimeout(this._scheduledLoad)
    if (this._lastLoad < Date.now() - TERM_MIN_DRAW_DELAY) {
      this.termScreen.load(this.serialize(), { theme: this.theme })
      this.theme = -1 // prevent useless theme setting next time
    } else {
      this._scheduledLoad = setTimeout(() => {
        this.termScreen.load(this.serialize())
      }, TERM_MIN_DRAW_DELAY - this._lastLoad)
    }
  }
  rainbowTimer () {
    if (!this.rainbow) return
    clearInterval(this._rainbowTimer)
    this._rainbowTimer = setInterval(() => {
      if (this.rainbow) this.scheduleLoad()
    }, 50)
  }
}

class Process extends EventEmitter {
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

let demoData = {
  buttons: {
    1: '',
    2: '',
    3: '',
    4: '',
    5: function (terminal, shell) {
      if (shell.child) shell.child.destroy()
      let chars = 'info\r'
      let loop = function () {
        shell.write(chars[0])
        chars = chars.substr(1)
        if (chars) setTimeout(loop, 100)
      }
      setTimeout(loop, 200)
    }
  },
  mouseReceiver: null
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
      let image = `
 ###.                          ESPTerm Demo
   '###.                       Hostname: ${window.location.hostname}
     '###.                     Shell: ESPTerm Demo Shell
       '###.                   Resolution: 80x25@${window.devicePixelRatio}x
         :###-
       .###'
     .###'
   .###'      ###############
 ###'         ###############
      `.split('\n').filter(line => line.trim())

      let chars = ''
      for (let y = 0; y < image.length; y++) {
        for (let x = 0; x < 80; x++) {
          if (image[y][x]) {
            chars += `\x1b[38;5;${getRainbowColor((x + y) / 10)}m${image[y][x]}`
          } else chars += ' '
        }
      }

      this.emit('write', '\r\n\x1b[?25l')
      let loop = () => {
        this.emit('write', chars.substr(0, 80))
        chars = chars.substr(80)
        if (chars.length) setTimeout(loop, 50)
        else {
          this.emit('write', '\r\n\x1b[?25h')
          this.destroy()
        }
      }
      loop()
    }
  },
  'local-echo': class LocalEcho extends Process {
    run (...args) {
      if (!args.includes('--suppress-note')) {
        this.emit('write', '\x1b[38;5;239mNote: not all terminal features are supported or and may not work as expected in this demo\x1b[0m\r\n')
      }
    }
    write (data) {
      this.emit('write', data)
    }
  },
  'info': class Info extends Process {
    run (...args) {
      let fast = args.includes('--fast')
      this.showSplash().then(() => {
        this.printText(fast)
      })
    }
    showSplash () {
      let splash = `
              -#####- -###*..#####- ######-
              -#*    -#-    .## .##.  *#-
              -##### .-###*..#####-   *#-  -*##*- #*-#--#**#-*##-
              -#*        -#-.##.      *#-  *##@#* ##.  -#* *# .#*
              -#####--####- .##.      *#-  -*#@@- ##.  -#* *# .#*
      `.split('\n').filter(line => line.trim())
      let levels = {
        ' ': -231,
        '.': 4,
        '-': 8,
        '*': 17,
        '#': 24
      }
      let characters = {
        ' ': ' ',
        '.': '░',
        '-': '▒',
        '*': '▓',
        '#': '█'
      }
      for (let i in splash) {
        if (splash[i].length < 79) splash[i] += ' '.repeat(79 - splash[i].length)
      }
      this.emit('write', '\r\n'.repeat(splash.length + 1))
      this.emit('write', '\x1b[A'.repeat(splash.length))
      this.emit('write', '\x1b[?25l')

      let cursorX = 0
      let cursorY = 0
      let moveTo = (x, y) => {
        let moveX = x - cursorX
        let moveY = y - cursorY
        this.emit('write', `\x1b[${Math.abs(moveX)}${moveX > 0 ? 'C' : 'D'}`)
        this.emit('write', `\x1b[${Math.abs(moveY)}${moveY > 0 ? 'B' : 'A'}`)
        cursorX = x
        cursorY = y
      }
      let drawCell = (x, y) => {
        moveTo(x, y)
        if (splash[y][x] === '@') {
          this.emit('write', '\x1b[48;5;238m\x1b[38;5;255m▄\b')
        } else {
          let level = 231 + levels[splash[y][x]]
          let character = characters[splash[y][x]]
          this.emit('write', `\x1b[48;5;${level}m\x1b[38;5;${level}m${character}\b`)
        }
      }
      return new Promise((resolve, reject) => {
        const self = this
        let x = 14
        let cycles = 0
        let loop = function () {
          for (let y = 0; y < splash.length; y++) {
            let dx = x - y
            if (dx > 0) drawCell(dx, y)
          }

          if (++x < 79) {
            if (++cycles >= 3) {
              setTimeout(loop, 20)
              cycles = 0
            } else loop()
          } else {
            moveTo(0, splash.length)
            self.emit('write', '\x1b[m\x1b[?25h')
            resolve()
          }
        }
        loop()
      })
    }
    printText (fast = false) {
      // lots of printing
      let parts = [
        '',
        '  ESPTerm is a VT100-like terminal emulator running on the ESP8266 WiFi chip.',
        '',
        '  \x1b[93mThis is an online demo of the web user interface, simulating a simple ',
        '  terminal in your browser.\x1b[m',
        '',
        '  Type \x1b[92mls\x1b[m to list available commands.',
        '  Use the \x1b[94mlinks\x1b[m below this screen for a demo of the options and more info.',
        ''
      ]

      if (fast) {
        this.emit('write', parts.join('\r\n') + '\r\n')
        this.destroy()
      } else {
        const self = this
        let loop = function () {
          self.emit('write', parts.shift() + '\r\n')
          if (parts.length) setTimeout(loop, 17)
          else self.destroy()
        }
        loop()
      }
    }
  },
  colors: class PrintColors extends Process {
    run () {
      this.emit('write', '\r\n')
      let fgtext = 'foreground-color'
      this.emit('write', '    ')
      for (let i = 0; i < 16; i++) {
        this.emit('write', '\x1b[' + (i < 8 ? `3${i}` : `9${i - 8}`) + 'm')
        this.emit('write', fgtext[i] + ' ')
      }
      this.emit('write', '\r\n    ')
      for (let i = 0; i < 16; i++) {
        this.emit('write', '\x1b[' + (i < 8 ? `4${i}` : `10${i - 8}`) + 'm  ')
      }
      this.emit('write', '\x1b[m\r\n')
      for (let r = 0; r < 6; r++) {
        this.emit('write', '    ')
        for (let g = 0; g < 6; g++) {
          for (let b = 0; b < 6; b++) {
            this.emit('write', `\x1b[48;5;${16 + r * 36 + g * 6 + b}m  `)
          }
          this.emit('write', '\x1b[m')
        }
        this.emit('write', '\r\n')
      }
      this.emit('write', '    ')
      for (let g = 0; g < 24; g++) {
        this.emit('write', `\x1b[48;5;${232 + g}m  `)
      }
      this.emit('write', '\x1b[m\r\n\n')
      this.destroy()
    }
  },
  ls: class ListCommands extends Process {
    run () {
      this.emit('write', '\x1b[92mList of demo commands\x1b[m\r\n')
      for (let i in demoshIndex) {
        if (typeof demoshIndex[i] === 'string') continue
        this.emit('write', i + '\r\n')
      }
      this.destroy()
    }
  },
  theme: class SetTheme extends Process {
    constructor (shell) {
      super()
      this.shell = shell
    }
    run (...args) {
      let theme = +args[0] | 0
      const maxnum = themes.length
      if (!args.length || !Number.isFinite(theme) || theme < 0 || theme >= maxnum) {
        this.emit('write', `\x1b[31mUsage: theme [0–${maxnum - 1}]\r\n`)
        this.destroy()
        return
      }
      this.shell.terminal.theme = theme
      // HACK: reset drawn screen to prevent only partly redrawn screen
      this.shell.terminal.termScreen.drawnScreenFG = []
      this.emit('write', '')
      this.destroy()
    }
  },
  cursor: class SetCursor extends Process {
    run (...args) {
      let steady = args.includes('--steady')
      if (args.includes('block')) {
        this.emit('write', `\x1b[${2 * steady} q`)
      } else if (args.includes('line')) {
        this.emit('write', `\x1b[${3 + steady} q`)
      } else if (args.includes('bar') || args.includes('beam')) {
        this.emit('write', `\x1b[${5 + steady} q`)
      } else {
        this.emit('write', '\x1b[31mUsage: cursor [block|line|bar] [--steady]\r\n')
      }
      this.destroy()
    }
  },
  rainbow: class ToggleRainbow extends Process {
    constructor (shell) {
      super()
      this.shell = shell
    }
    run () {
      this.shell.terminal.rainbow = !this.shell.terminal.rainbow
      this.shell.terminal.rainbowTimer()
      this.emit('write', '')
      this.destroy()
    }
  },
  mouse: class ShowMouse extends Process {
    constructor (shell) {
      super()
      this.shell = shell
    }
    run () {
      this.shell.terminal.trackMouse = true
      demoData.mouseReceiver = this
      this.randomData = []
      this.highlighted = {}
      let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      for (let i = 0; i < 23; i++) {
        let line = ''
        for (let j = 0; j < 79; j++) {
          line += characters[Math.floor(characters.length * Math.random())]
        }
        this.randomData.push(line)
      }
      this.scrollOffset = 0
      this.render()
    }
    render () {
      this.emit('write', '\x1b[m\x1b[2J\x1b[1;1H')
      this.emit('write', '\x1b[97m\x1b[1mMouse Demo\r\n\x1b[mMouse movement, clicking and scrolling!')

      // render random data for scrolling
      for (let y = 0; y < 23; y++) {
        let index = y + this.scrollOffset
        // proper modulo:
        index = ((index % this.randomData.length) + this.randomData.length) % this.randomData.length
        let line = this.randomData[index]
        let lineData = `\x1b[${3 + y};1H\x1b[38;5;239m`
        for (let x in line) {
          if (this.highlighted[(y + 2) * 80 + (+x)]) lineData += '\x1b[97m'
          lineData += line[x]
          if (this.highlighted[(y + 2) * 80 + (+x)]) lineData += '\x1b[38;5;239m'
        }
        this.emit('write', lineData)
      }

      // move cursor to mouse
      if (this.mouse) {
        this.emit('write', `\x1b[${this.mouse.y + 1};${this.mouse.x + 1}H`)
      }
    }
    mouseMove (x, y) {
      this.mouse = { x, y }
      this.render()
    }
    mouseDown (x, y, button) {
      if (button === 4) this.scrollOffset--
      else if (button === 5) this.scrollOffset++
      else this.highlighted[y * 80 + x] = !this.highlighted[y * 80 + x]
      this.render()
    }
    mouseUp (x, y, button) {}
    destroy () {
      this.shell.terminal.write('\x1b[2J\x1b[1;1H')
      this.shell.terminal.trackMouse = false
      if (demoData.mouseReceiver === this) demoData.mouseReceiver = null
      super.destroy()
    }
  },
  sudo: class Sudo extends Process {
    constructor (shell) {
      super()
      this.shell = shell
    }
    run (...args) {
      if (args.length === 0) {
        this.emit('write', '\x1b[31mUsage: sudo <command>\x1b[m\r\n')
        this.destroy()
      } else if (args.length === 4 && args.join(' ').toLowerCase() === 'make me a sandwich') {
        const b = '\x1b[33m'
        const r = '\x1b[0m'
        const l = '\x1b[32m'
        const c = '\x1b[38;5;229m'
        const h = '\x1b[38;5;225m'
        this.emit('write',
          `                    ${b}_.---._\r\n` +
          `                _.-~       ~-._\r\n` +
          `            _.-~               ~-._\r\n` +
          `        _.-~                       ~---._\r\n` +
          `    _.-~                                 ~\\\r\n` +
          ` .-~                                    _.;\r\n` +
          ` :-._                               _.-~ ./\r\n` +
          ` \`-._~-._                   _..__.-~ _.-~\r\n` +
          `  ${c}/  ${b}~-._~-._              / .__..--${c}~-${l}---._\r\n` +
          `${c} \\_____(_${b};-._\\.        _.-~_/${c}       ~)${l}.. . \\\r\n` +
          `${l}    /(_____  ${b}\\\`--...--~_.-~${c}______..-+${l}_______)\r\n` +
          `${l}  .(_________/${b}\`--...--~/${l}    _/ ${h}          ${b}/\\\r\n` +
          `${b} /-._${h}     \\_     ${l}(___./_..-~${h}__.....${b}__..-~./\r\n` +
          `${b} \`-._~-._${h}   ~\\--------~  .-~${b}_..__.-~ _.-~\r\n` +
          `${b}     ~-._~-._ ${h}~---------\`  ${b}/ .__..--~\r\n` +
          `${b}         ~-._\\.        _.-~_/\r\n` +
          `${b}             \\\`--...--~_.-~\r\n` +
          `${b}              \`--...--~${r}\r\n`)
        this.destroy()
      } else {
        let name = args.shift()
        if (this.shell.index[name]) {
          let Process = this.shell.index[name]
          if (Process instanceof Function) {
            let child = new Process(this)
            let write = data => this.emit('write', data)
            child.on('write', write)
            child.on('exit', code => {
              child.removeListener('write', write)
              this.destroy()
            })
            child.run(...args)
          } else {
            this.emit('write', Process)
            this.destroy()
          }
        } else {
          this.emit('write', `sudo: ${name}: command not found\r\n`)
          this.destroy()
        }
      }
    }
  },
  make: class Make extends Process {
    run (...args) {
      if (args.length === 0) this.emit('write', '\x1b[31mmake: *** No targets specified.  Stop.\x1b[0m\r\n')
      else if (args.length === 3 && args.join(' ').toLowerCase() === 'me a sandwich') {
        this.emit('write', '\x1b[31mmake: me a sandwich : Permission denied\x1b[0m\r\n')
      } else {
        this.emit('write', `\x1b[31mmake: *** No rule to make target '${args.join(' ').toLowerCase()}'.  Stop.\x1b[0m\r\n`)
      }
      this.destroy()
    }
  },
  pwd: '/this/is/a/demo\r\n',
  cd: '\x1b[38;5;239mNo directories to change to\r\n',
  whoami: `${window.navigator.userAgent}\r\n`,
  hostname: `${window.location.hostname}`,
  uname: 'ESPTerm Demo\r\n',
  mkdir: '\x1b[38;5;239mDid not create a directory because this is a demo.\r\n',
  rm: '\x1b[38;5;239mDid not delete anything because this is a demo.\r\n',
  cp: '\x1b[38;5;239mNothing to copy because this is a demo.\r\n',
  mv: '\x1b[38;5;239mNothing to move because this is a demo.\r\n',
  ln: '\x1b[38;5;239mNothing to link because this is a demo.\r\n',
  touch: '\x1b[38;5;239mNothing to touch\r\n',
  exit: '\x1b[38;5;239mNowhere to go\r\n',
  github: class GoToGithub extends Process {
    run () {
      window.open('https://github.com/espterm/espterm-firmware')
      this.destroy()
    }
  }
}

class DemoShell {
  constructor (terminal, printInfo) {
    this.terminal = terminal
    this.terminal.reset()
    this.parser = new ANSIParser((...args) => this.handleParsed(...args))
    this.history = []
    this.historyIndex = 0
    this.cursorPos = 0
    this.child = null
    this.index = demoshIndex

    if (printInfo) this.run('info')
    else this.prompt()
  }
  write (text) {
    if (this.child) {
      if (text.codePointAt(0) === 3) this.child.destroy()
      else this.child.write(text)
    } else this.parser.write(text)
  }
  prompt (success = true) {
    if (this.terminal.cursor.x !== 0) this.terminal.write('\x1b[m\x1b[38;5;238m⏎\r\n')
    this.terminal.write('\x1b[34;1mdemosh \x1b[m')
    if (!success) this.terminal.write('\x1b[31m')
    this.terminal.write('$ \x1b[m')
    this.history.unshift('')
    this.cursorPos = 0
  }
  copyFromHistoryIndex () {
    if (!this.historyIndex) return
    let current = this.history[this.historyIndex]
    this.history[0] = current
    this.historyIndex = 0
  }
  handleParsed (action, ...args) {
    this.terminal.write('\b\x1b[P'.repeat(this.cursorPos))
    if (action === 'write') {
      this.copyFromHistoryIndex()
      this.history[0] = this.history[0].substr(0, this.cursorPos) + args[0] + this.history[0].substr(this.cursorPos)
      this.cursorPos++
    } else if (action === 'back') {
      this.copyFromHistoryIndex()
      this.history[0] = this.history[0].substr(0, this.cursorPos - 1) + this.history[0].substr(this.cursorPos)
      this.cursorPos--
      if (this.cursorPos < 0) this.cursorPos = 0
    } else if (action === 'tab') {
      console.warn('TAB not implemented') // TODO completion
    } else if (action === 'move-cursor-x') {
      this.cursorPos = Math.max(0, Math.min(this.history[this.historyIndex].length, this.cursorPos + args[0]))
    } else if (action === 'delete-line') {
      this.copyFromHistoryIndex()
      this.history[0] = ''
      this.cursorPos = 0
    } else if (action === 'delete-word') {
      this.copyFromHistoryIndex()
      let words = this.history[0].substr(0, this.cursorPos).split(' ')
      words.pop()
      this.history[0] = words.join(' ') + this.history[0].substr(this.cursorPos)
      this.cursorPos = words.join(' ').length
    } else if (action === 'move-cursor-y') {
      this.historyIndex -= args[0]
      if (this.historyIndex < 0) this.historyIndex = 0
      if (this.historyIndex >= this.history.length) this.historyIndex = this.history.length - 1
      this.cursorPos = this.history[this.historyIndex].length
    }

    this.terminal.write(this.history[this.historyIndex])
    this.terminal.write('\b'.repeat(this.history[this.historyIndex].length))
    this.terminal.moveForward(this.cursorPos)
    this.terminal.write('') // dummy. Apply the moveFoward

    if (action === 'return') {
      this.terminal.write('\r\n')
      this.parse(this.history[this.historyIndex])
    }
  }
  parse (input) {
    if (input === 'help') input = 'info'
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
    if (Process instanceof Function) {
      this.child = new Process(this)
      let write = data => this.terminal.write(data)
      this.child.on('write', write)
      this.child.on('exit', code => {
        if (this.child) this.child.removeListener('write', write)
        this.child = null
        this.prompt(!code)
      })
      this.child.run(...args)
    } else {
      this.terminal.write(Process)
      this.prompt()
    }
  }
}

window.demoInterface = module.exports = {
  input (data) {
    let type = data[0]
    let content = data.substr(1)

    if (type === 's') {
      this.shell.write(content)
    } else if (type === 'b') {
      let button = content.charCodeAt(0)
      let action = demoData.buttons[button]
      if (action) {
        if (typeof action === 'string') this.shell.write(action)
        else if (action instanceof Function) action(this.terminal, this.shell)
      }
    } else if (type === 'm' || type === 'p' || type === 'r') {
      let row = parse2B(content, 0)
      let column = parse2B(content, 2)
      let button = parse2B(content, 4)
      let modifiers = parse2B(content, 6)

      if (demoData.mouseReceiver) {
        if (type === 'm') demoData.mouseReceiver.mouseMove(column, row, button, modifiers)
        else if (type === 'p') demoData.mouseReceiver.mouseDown(column, row, button, modifiers)
        else if (type === 'r') demoData.mouseReceiver.mouseUp(column, row, button, modifiers)
      }
    }
  },
  didInit: false,
  init (screen) {
    if (this.didInit) return
    this.didInit = true
    this.terminal = new ScrollingTerminal(screen)
    this.shell = new DemoShell(this.terminal, true)
  }
}
