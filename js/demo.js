const TERM_DEFAULT_STYLE = 7
const TERM_MIN_DRAW_DELAY = 10

class ScrollingTerminal {
  constructor (screen) {
    this.width = 80
    this.height = 25
    this.termScreen = screen

    this.reset()

    this._lastLoad = Date.now()
    this.termScreen.load(this.serialize(), 0)
  }
  reset () {
    this.style = TERM_DEFAULT_STYLE
    this.cursor = { x: 0, y: 0, style: 1 }
    this.trackMouse = false
    this.currentSequence = 0
    this.sequence = ''
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
  deleteChar () {
    this.cursor.x--
    if (this.cursor.x < 0) {
      this.cursor.x = this.width - 1
      this.cursor.y = Math.max(0, this.cursor.y - 1)
    }
    this.screen.splice((this.cursor.y + 1) * this.width, 0, [' ', TERM_DEFAULT_STYLE])
    this.screen.splice(this.cursor.y * this.width + this.cursor.x, 1)
  }
  clampCursor () {
    if (this.cursor.x < 0) this.cursor.x = 0
    if (this.cursor.y < 0) this.cursor.y = 0
    if (this.cursor.x > this.width - 1) this.cursor.x = this.width - 1
    if (this.cursor.y > this.height - 1) this.cursor.y = this.height - 1
  }
  applySequence (sequence) {
    if (sequence[0] === '[') {
      let type = sequence[sequence.length - 1]
      let content = sequence.substring(1, sequence.length - 1)

      let numbers = content ? content.split(';').map(i => +i.replace(/\D/g, '')) : []
      let numOr1 = numbers.length ? numbers[0] : 1
      if (type === 'H') {
        this.cursor.x = (numbers[0] | 0) - 1
        this.cursor.y = (numbers[1] | 0) - 1
        this.clampCursor()
      } else if (type >= 'A' && type <= 'D') {
        this.cursor[type <= 'B' ? 'y' : 'x'] += ((type === 'B' || type === 'C') ? 1 : -1) * numOr1
        this.clampCursor()
      } else if (type === 'E' || type === 'F') {
        this.cursor.x = 0
        this.cursor.y += (type === 'E' ? 1 : -1) * numOr1
        this.clampCursor()
      } else if (type === 'G') {
        this.cursor.x = numOr1 - 1
        this.clampCursor()
      } else if (type === 'q') this.cursor.style = numOr1
      else if (type === 'm') {
        if (!numbers.length) {
          this.style = TERM_DEFAULT_STYLE
          return
        }
        let type = numbers[0]
        if (type === 1) this.style |= 1 << 16 // bold
        else if (type === 2) this.style |= 1 << 1 << 16 // faint
        else if (type === 3) this.style |= 1 << 2 << 16 // italic
        else if (type === 4) this.style |= 1 << 3 << 16 // underline
        else if (type === 5 || type === 6) this.style |= 1 << 4 << 16 // blink
        else if (type === 7) {
          // invert
          this.style = (this.style & 0xFF0000) | ((this.style >> 8) & 0xFF) | ((this.style & 0xFF) << 8)
        } else if (type === 9) this.style |= 1 << 6 << 16 // strike
        else if (type === 20) this.style |= 1 << 5 << 16 // fraktur
        else if (type >= 30 && type <= 38) this.style = (this.style & 0xFFFF00) | (type % 10)
        else if (type >= 40 && type <= 48) this.style = (this.style & 0xFF00FF) | ((type % 10) << 8)
        else if (type === 39) this.style = (this.style & 0xFFFF00) | 7
        else if (type === 49) this.style = (this.style & 0xFF00FF) | (7 << 8)
        else if (type >= 90 && type <= 98) this.style = (this.style & 0xFFFF00) | ((type % 10) + 8)
        else if (type >= 100 && type <= 108) this.style = (this.style & 0xFF00FF) | (((type % 10) + 8) << 8)
        else if (type === 38 || type === 48) {
          if (numbers[1] === 5) {
            let color = (numbers[2] | 0) & 0xFF
            if (type === 38) this.style = (this.style & 0xFFFF00) | color
            if (type === 48) this.style = (this.style & 0xFF00FF) | (color << 8)
          }
        }
      }
    }
  }
  write (text) {
    for (let character of text) {
      let code = character.codePointAt(0)
      if (code === 0x1b) this.currentSequence = 1
      else if (this.currentSequence === 1 && character === '[') {
        this.currentSequence = 2
        this.sequence += '['
      } else if (this.currentSequence && character.match(/[\x40-\x7e]/)) {
        this.applySequence(this.sequence + character)
        this.currentSequence = 0
        this.sequence = ''
      } else if (this.currentSequence > 1) this.sequence += character
      else if (this.currentSequence === 1) {
        // something something nothing
        this.currentSequence = 0
        this.writeChar(character)
      } else if (code === 0x07) this.termScreen.load('B')
      else if (code === 0x08) this.deleteChar()
      else if (code === 0x0a) this.newLine()
      else if (code === 0x0d) this.cursor.x = 0
      else this.writeChar(character)
    }
    this.scheduleLoad()
  }
  serialize () {
    let serialized = 'S'
    serialized += encode2B(this.height) + encode2B(this.width)
    serialized += encode2B(this.cursor.y) + encode2B(this.cursor.x)

    let attributes = 1 // cursor always visible
    attributes |= (3 << 5) * +this.trackMouse // track mouse controls both
    attributes |= 3 << 7 // buttons/links always visible
    attributes |= (this.cursor.shape << 9)
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

window.demoInterface = {
  input (data) {
    let type = data[0]
    let content = data.substr(1)

    if (type === 's') {
      this.terminal.write(content)
    } else if (type === 'b') {
      let button = content.charCodeAt(0)
      console.log(`button ${button} pressed`)
    } else if (type === 'm' || type === 'p' || type === 'r') {
      console.log(JSON.stringify(data))
    }
  },
  init (screen) {
    this.terminal = new ScrollingTerminal(screen)
  }
}
