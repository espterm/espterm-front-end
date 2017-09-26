const { qs } = require('../utils')

module.exports = function (screen, input) {
  const keyInput = qs('#softkb-input')
  if (!keyInput) return // abort, we're not on the terminal page

  const shortcutBar = document.createElement('div')
  shortcutBar.id = 'keyboard-shortcut-bar'
  if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
    qs('#screen').appendChild(shortcutBar)
  }

  let keyboardOpen = false

  // moves the input to where the cursor is on the canvas.
  // this is because most browsers will always scroll to wherever the focused
  // input is
  let updateInputPosition = function () {
    if (!keyboardOpen) return

    let [x, y] = screen.gridToScreen(screen.cursor.x, screen.cursor.y, true)
    keyInput.style.transform = `translate(${x}px, ${y}px)`
  }

  keyInput.addEventListener('focus', () => {
    keyboardOpen = true
    updateInputPosition()
    shortcutBar.classList.add('open')
  })

  keyInput.addEventListener('blur', () => {
    keyboardOpen = false
    shortcutBar.classList.remove('open')
  })

  screen.on('cursor-moved', updateInputPosition)

  qs('#term-kb-open').addEventListener('click', e => {
    e.preventDefault()
    keyInput.focus()
  })

  // Chrome for Android doesn't send proper keydown/keypress events with
  // real key values instead of 229 “Unidentified,” so here's a workaround
  // that deals with the input composition events.

  let lastCompositionString = ''

  // sends the difference between the last and the new composition string
  let sendInputDelta = function (newValue) {
    let resend = false
    if (newValue.length > lastCompositionString.length) {
      if (newValue.startsWith(lastCompositionString)) {
        // characters have been added at the end
        input.sendString(newValue.substr(lastCompositionString.length))
      } else resend = true
    } else if (newValue.length < lastCompositionString.length) {
      if (lastCompositionString.startsWith(newValue)) {
        // characters have been removed at the end
        input.sendString('\b'.repeat(lastCompositionString.length -
          newValue.length))
      } else resend = true
    } else if (newValue !== lastCompositionString) resend = true

    if (resend) {
      // the entire string changed; resend everything
      input.sendString('\b'.repeat(lastCompositionString.length) +
        newValue)
    }
    lastCompositionString = newValue
  }

  keyInput.addEventListener('keydown', e => {
    if (e.key === 'Unidentified') return

    keyInput.value = ''

    e.stopPropagation()
    input.handleKeyDown(e)
  })

  keyInput.addEventListener('keypress', e => {
    // prevent key duplication on iOS (because Safari *does* send proper events)
    e.stopPropagation()
  })

  keyInput.addEventListener('input', e => {
    e.stopPropagation()

    if (e.isComposing && 'data' in e) {
      sendInputDelta(e.data)
    } else if (e.isComposing) {
      // Firefox Mobile doesn't support InputEvent#data, so here's a hack
      // that just takes the input value and uses that
      sendInputDelta(keyInput.value)
    } else {
      if (e.inputType === 'insertCompositionText') input.sendString(e.data)
      else if (e.inputType === 'deleteContentBackward') {
        lastCompositionString = ''
        sendInputDelta('')
      } else if (e.inputType === 'insertText') {
        input.sendString(e.data)
      }
    }
  })

  keyInput.addEventListener('compositionstart', e => {
    lastCompositionString = ''
  })

  keyInput.addEventListener('compositionend', e => {
    lastCompositionString = ''
    keyInput.value = ''
  })

  screen.on('open-soft-keyboard', () => keyInput.focus())

  // shortcut bar
  const shortcuts = {
    Control: 'ctrl',
    Esc: 0x1b,
    Tab: 0x09,
    '←': 0x25,
    '↓': 0x28,
    '↑': 0x26,
    '→': 0x27
  }

  let touchMoved = false

  for (const shortcut in shortcuts) {
    const button = document.createElement('button')
    button.classList.add('shortcut-button')
    button.textContent = shortcut
    shortcutBar.appendChild(button)

    const key = shortcuts[shortcut]
    if (typeof key === 'string') button.classList.add('modifier')
    button.addEventListener('touchstart', e => {
      touchMoved = false
      if (typeof key === 'string') {
        // modifier button
        input.softModifiers[key] = true
        button.classList.add('enabled')

        // prevent default. This prevents scrolling, but also prevents the
        // selection popup
        e.preventDefault()
      }
    })
    window.addEventListener('touchmove', e => {
      touchMoved = true
    })
    button.addEventListener('touchend', e => {
      e.preventDefault()
      if (typeof key === 'number') {
        if (touchMoved) return
        let fakeEvent = { which: key, preventDefault: () => {} }
        input.handleKeyDown(fakeEvent)
      } else if (typeof key === 'string') {
        button.classList.remove('enabled')
        input.softModifiers[key] = false
      }
    })
  }
}
