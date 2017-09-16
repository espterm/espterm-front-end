/**
 * User input
 *
 * --- Rx messages: ---
 * S - screen content (binary encoding of the entire screen with simple compression)
 * T - text labels - Title and buttons, \0x01-separated
 * B - beep
 * . - heartbeat
 *
 * --- Tx messages ---
 * s - string
 * b - action button
 * p - mb press
 * r - mb release
 * m - mouse move
 */
window.Input = function (conn, screen) {
  const KEY_NAMES = {
    0x03: 'Cancel',
    0x06: 'Help',
    0x08: 'Backspace',
    0x09: 'Tab',
    0x0C: 'Clear',
    0x0D: 'Enter',
    0x10: 'Shift',
    0x11: 'Control',
    0x12: 'Alt',
    0x13: 'Pause',
    0x14: 'CapsLock',
    0x1B: 'Escape',
    0x20: ' ',
    0x21: 'PageUp',
    0x22: 'PageDown',
    0x23: 'End',
    0x24: 'Home',
    0x25: 'ArrowLeft',
    0x26: 'ArrowUp',
    0x27: 'ArrowRight',
    0x28: 'ArrowDown',
    0x29: 'Select',
    0x2A: 'Print',
    0x2B: 'Execute',
    0x2C: 'PrintScreen',
    0x2D: 'Insert',
    0x2E: 'Delete',
    0x3A: ':',
    0x3B: ';',
    0x3C: '<',
    0x3D: '=',
    0x3E: '>',
    0x3F: '?',
    0x40: '@',
    0x5B: 'Meta',
    0x5C: 'Meta',
    0x5D: 'ContextMenu',
    0x6A: 'Numpad*',
    0x6B: 'Numpad+',
    0x6D: 'Numpad-',
    0x6E: 'Numpad.',
    0x6F: 'Numpad/',
    0x90: 'NumLock',
    0x91: 'ScrollLock',
    0xA0: '^',
    0xA1: '!',
    0xA2: '"',
    0xA3: '#',
    0xA4: '$',
    0xA5: '%',
    0xA6: '&',
    0xA7: '_',
    0xA8: '(',
    0xA9: ')',
    0xAA: '*',
    0xAB: '+',
    0xAC: '|',
    0xAD: '-',
    0xAE: '{',
    0xAF: '}',
    0xB0: '~',
    0xBA: ';',
    0xBB: '=',
    0xBC: 'Numpad,',
    0xBD: '-',
    0xBE: 'Numpad,',
    0xC0: '`',
    0xC2: 'Numpad,',
    0xDB: '[',
    0xDC: '\\',
    0xDD: ']',
    0xDE: "'",
    0xE0: 'Meta'
  }
  // numbers 0-9
  for (let i = 0x30; i <= 0x39; i++) KEY_NAMES[i] = String.fromCharCode(i)
  // characters A-Z
  for (let i = 0x41; i <= 0x5A; i++) KEY_NAMES[i] = String.fromCharCode(i)
  // function F1-F20
  for (let i = 0x70; i <= 0x83; i++) KEY_NAMES[i] = `F${i - 0x70 + 1}`
  // numpad 0-9
  for (let i = 0x60; i <= 0x69; i++) KEY_NAMES[i] = `Numpad${i - 0x60}`

  let cfg = {
    np_alt: false,
    cu_alt: false,
    fn_alt: false,
    mt_click: false,
    mt_move: false,
    no_keys: false,
    crlf_mode: false,
    all_fn: false
  }

  /** Fn alt choice for key message */
  const fa = (alt, normal) => cfg.fn_alt ? alt : normal

  /** Cursor alt choice for key message */
  const ca = (alt, normal) => cfg.cu_alt ? alt : normal

  /** Numpad alt choice for key message */
  const na = (alt, normal) => cfg.np_alt ? alt : normal

  const keymap = {
    /* eslint-disable key-spacing */
    'Backspace':     '\x08',
    'Tab':           '\x09',
    'Enter':         () => cfg.crlf_mode ? '\x0d\x0a' : '\x0d',
    'Control+Enter': '\x0a',
    'Escape':        '\x1b',
    'ArrowUp':       () => ca('\x1bOA', '\x1b[A'),
    'ArrowDown':     () => ca('\x1bOB', '\x1b[B'),
    'ArrowRight':    () => ca('\x1bOC', '\x1b[C'),
    'ArrowLeft':     () => ca('\x1bOD', '\x1b[D'),
    'Home':          () => ca('\x1bOH', fa('\x1b[H', '\x1b[1~')),
    'Insert':        '\x1b[2~',
    'Delete':        '\x1b[3~',
    'End':           () => ca('\x1bOF', fa('\x1b[F', '\x1b[4~')),
    'PageUp':        '\x1b[5~',
    'PageDown':      '\x1b[6~',
    'F1':            () => fa('\x1bOP', '\x1b[11~'),
    'F2':            () => fa('\x1bOQ', '\x1b[12~'),
    'F3':            () => fa('\x1bOR', '\x1b[13~'),
    'F4':            () => fa('\x1bOS', '\x1b[14~'),
    'F5':            '\x1b[15~', // note the disconnect
    'F6':            '\x1b[17~',
    'F7':            '\x1b[18~',
    'F8':            '\x1b[19~',
    'F9':            '\x1b[20~',
    'F10':           '\x1b[21~', // note the disconnect
    'F11':           '\x1b[23~',
    'F12':           '\x1b[24~',
    'Shift+F1':      () => fa('\x1bO1;2P', '\x1b[25~'),
    'Shift+F2':      () => fa('\x1bO1;2Q', '\x1b[26~'), // note the disconnect
    'Shift+F3':      () => fa('\x1bO1;2R', '\x1b[28~'),
    'Shift+F4':      () => fa('\x1bO1;2S', '\x1b[29~'), // note the disconnect
    'Shift+F5':      () => fa('\x1b[15;2~', '\x1b[31~'),
    'Shift+F6':      () => fa('\x1b[17;2~', '\x1b[32~'),
    'Shift+F7':      () => fa('\x1b[18;2~', '\x1b[33~'),
    'Shift+F8':      () => fa('\x1b[19;2~', '\x1b[34~'),
    'Shift+F9':      () => fa('\x1b[20;2~', '\x1b[35~'), // 35-38 are not standard - but what is?
    'Shift+F10':     () => fa('\x1b[21;2~', '\x1b[36~'),
    'Shift+F11':     () => fa('\x1b[22;2~', '\x1b[37~'),
    'Shift+F12':     () => fa('\x1b[23;2~', '\x1b[38~'),
    'Numpad0':       () => na('\x1bOp', '0'),
    'Numpad1':       () => na('\x1bOq', '1'),
    'Numpad2':       () => na('\x1bOr', '2'),
    'Numpad3':       () => na('\x1bOs', '3'),
    'Numpad4':       () => na('\x1bOt', '4'),
    'Numpad5':       () => na('\x1bOu', '5'),
    'Numpad6':       () => na('\x1bOv', '6'),
    'Numpad7':       () => na('\x1bOw', '7'),
    'Numpad8':       () => na('\x1bOx', '8'),
    'Numpad9':       () => na('\x1bOy', '9'),
    'Numpad*':       () => na('\x1bOR', '*'),
    'Numpad+':       () => na('\x1bOl', '+'),
    'Numpad-':       () => na('\x1bOS', '-'),
    'Numpad.':       () => na('\x1bOn', '.'),
    'Numpad/':       () => na('\x1bOQ', '/'),
    // we don't implement numlock key (should change in numpad_alt mode,
    // but it's even more useless than the rest and also has the side
    // effect of changing the user's numlock state)

    // shortcuts
    'Control+]':  '\x1b', // alternate way to enter ESC
    'Control+\\': '\x1c',
    'Control+[':  '\x1d',
    'Control+^':  '\x1e',
    'Control+_':  '\x1f',

    // extra controls
    'Control+ArrowLeft':  '\x1f[1;5D',
    'Control+ArrowRight': '\x1f[1;5C',
    'Control+ArrowUp':    '\x1f[1;5A',
    'Control+ArrowDown':  '\x1f[1;5B',
    'Control+Home':       '\x1f[1;5H',
    'Control+End':        '\x1f[1;5F',

    // extra shift controls
    'Shift+ArrowLeft':  '\x1f[1;2D',
    'Shift+ArrowRight': '\x1f[1;2C',
    'Shift+ArrowUp':    '\x1f[1;2A',
    'Shift+ArrowDown':  '\x1f[1;2B',
    'Shift+Home':       '\x1f[1;2H',
    'Shift+End':        '\x1f[1;2F',

    // macOS text editing commands
    'Alt+ArrowLeft':       '\x1bb',    // ⌥← to go back a word (^[b)
    'Alt+ArrowRight':      '\x1bf',    // ⌥→ to go forward one word (^[f)
    'Meta+ArrowLeft':      '\x01',     // ⌘← to go to the beginning of a line (^A)
    'Meta+ArrowRight':     '\x05',     // ⌘→ to go to the end of a line (^E)
    'Alt+Backspace':       '\x17',     // ⌥⌫ to delete a word (^W)
    'Meta+Backspace':      '\x15',     // ⌘⌫ to delete to the beginning of a line (^U)

    // copy to clipboard
    'Control+Shift+C' () {
      screen.copySelectionToClipboard()
    }
    /* eslint-enable key-spacing */
  }

  // ctrl+[A-Z] sent as simple low ASCII codes
  for (let i = 1; i <= 26; i++) keymap[`Control+${String.fromCharCode(0x40 + i)}`] = String.fromCharCode(i)

  /** Send a literal message */
  function sendString (str) {
    return conn.send('s' + str)
  }

  /** Send a button event */
  function sendButton (n) {
    conn.send('b' + String.fromCharCode(n))
  }

  const keyBlacklist = [
    'F5', 'F11', 'F12', 'Shift+F5'
  ]

  const handleKeyDown = function (e) {
    if (cfg.no_keys) return

    let modifiers = []
    // sorted alphabetically
    if (e.altKey) modifiers.push('Alt')
    if (e.ctrlKey) modifiers.push('Control')
    if (e.metaKey) modifiers.push('Meta')
    if (e.shiftKey) modifiers.push('Shift')

    let key = KEY_NAMES[e.which] || e.key

    // ignore clipboard events
    if ((e.ctrlKey || e.metaKey) && key === 'V') return

    let binding = null

    for (let name in keymap) {
      let itemModifiers = name.split('+')
      let itemKey = itemModifiers.pop()

      if (itemKey === key && itemModifiers.sort().join() === modifiers.join()) {
        if (keyBlacklist.includes(name) && !cfg.all_fn) continue
        binding = keymap[name]
        break
      }
    }

    if (binding) {
      if (binding instanceof Function) binding = binding()
      e.preventDefault()
      if (typeof binding === 'string') {
        sendString(binding)
      }
    }
  }

  /** Bind/rebind key messages */
  function initKeys ({ allFn }) {
    // This takes care of text characters typed
    window.addEventListener('keypress', function (evt) {
      if (cfg.no_keys) return
      if (evt.ctrlKey || evt.metaKey) return

      let str = ''
      if (evt.key && evt.key.length === 1) str = evt.key
      else if (evt.which && evt.which !== 229) str = String.fromCodePoint(evt.which)

      if (str.length > 0 && str.charCodeAt(0) >= 32) {
        // prevent space from scrolling
        if (evt.which === 32) evt.preventDefault()
        sendString(str)
      }
    })

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('copy', e => {
      let selectedText = screen.getSelectedText()
      if (selectedText) {
        e.preventDefault()
        e.clipboardData.setData('text/plain', selectedText)
      }
    })
    window.addEventListener('paste', e => {
      e.preventDefault()
      console.log('User pasted:\n' + e.clipboardData.getData('text/plain'))

      // just write it for now
      sendString(e.clipboardData.getData('text/plain'))
    })

    cfg.all_fn = allFn
  }

  // mouse button states
  let mb1 = 0
  let mb2 = 0
  let mb3 = 0

  /** Init the Input module */
  function init (opts) {
    initKeys(opts)

    // Button presses
    $('#action-buttons button').forEach(s => {
      s.addEventListener('click', function (evt) {
        sendButton(+this.dataset['n'])
      })
    })

    // global mouse state tracking - for motion reporting
    window.addEventListener('mousedown', evt => {
      if (evt.button === 0) mb1 = 1
      if (evt.button === 1) mb2 = 1
      if (evt.button === 2) mb3 = 1
    })

    window.addEventListener('mouseup', evt => {
      if (evt.button === 0) mb1 = 0
      if (evt.button === 1) mb2 = 0
      if (evt.button === 2) mb3 = 0
    })
  }

  // record modifier keys
  // bits: Meta, Alt, Shift, Ctrl
  let modifiers = 0b0000

  window.addEventListener('keydown', e => {
    if (e.ctrlKey) modifiers |= 1
    if (e.shiftKey) modifiers |= 2
    if (e.altKey) modifiers |= 4
    if (e.metaKey) modifiers |= 8
  })
  window.addEventListener('keyup', e => {
    modifiers = 0
    if (e.ctrlKey) modifiers |= 1
    if (e.shiftKey) modifiers |= 2
    if (e.altKey) modifiers |= 4
    if (e.metaKey) modifiers |= 8
  })

  /** Prepare modifiers byte for mouse message */
  function packModifiersForMouse () {
    return modifiers
  }

  return {
    /** Init the Input module */
    init,

    /** Send a literal string message */
    sendString,

    /** Enable alternate key modes (cursors, numpad, fn) */
    setAlts: function (cu, np, fn, crlf) {
      if (cfg.cu_alt !== cu || cfg.np_alt !== np || cfg.fn_alt !== fn || cfg.crlf_mode !== crlf) {
        cfg.cu_alt = cu
        cfg.np_alt = np
        cfg.fn_alt = fn
        cfg.crlf_mode = crlf

        // rebind keys - codes have changed
        bindFnKeys()
      }
    },

    setMouseMode (click, move) {
      cfg.mt_click = click
      cfg.mt_move = move
    },

    // Mouse events
    onMouseMove (x, y) {
      if (!cfg.mt_move) return
      const b = mb1 ? 1 : mb2 ? 2 : mb3 ? 3 : 0
      const m = packModifiersForMouse()
      conn.send('m' + encode2B(y) + encode2B(x) + encode2B(b) + encode2B(m))
    },

    onMouseDown (x, y, b) {
      if (!cfg.mt_click) return
      if (b > 3 || b < 1) return
      const m = packModifiersForMouse()
      conn.send('p' + encode2B(y) + encode2B(x) + encode2B(b) + encode2B(m))
      // console.log("B ",b," M ",m);
    },

    onMouseUp (x, y, b) {
      if (!cfg.mt_click) return
      if (b > 3 || b < 1) return
      const m = packModifiersForMouse()
      conn.send('r' + encode2B(y) + encode2B(x) + encode2B(b) + encode2B(m))
      // console.log("B ",b," M ",m);
    },

    onMouseWheel (x, y, dir) {
      if (!cfg.mt_click) return
      // -1 ... btn 4 (away from user)
      // +1 ... btn 5 (towards user)
      const m = packModifiersForMouse()
      const b = (dir < 0 ? 4 : 5)
      conn.send('p' + encode2B(y) + encode2B(x) + encode2B(b) + encode2B(m))
      // console.log("B ",b," M ",m);
    },

    /**
     * Prevent capturing keys. This is used for text input
     * modals on the terminal screen
     */
    blockKeys (yes) {
      cfg.no_keys = yes
    }
  }
}
