window.initSoftKeyboard = function (screen, input) {
  const keyInput = qs('#softkb-input')
  if (!keyInput) return // abort, we're not on the terminal page

  let keyboardOpen = false

  let updateInputPosition = function () {
    if (!keyboardOpen) return

    let [x, y] = screen.gridToScreen(screen.cursor.x, screen.cursor.y, true)
    keyInput.style.transform = `translate(${x}px, ${y}px)`
  }

  keyInput.addEventListener('focus', () => {
    keyboardOpen = true
    updateInputPosition()
  })

  keyInput.addEventListener('blur', () => (keyboardOpen = false))

  screen.on('cursor-moved', updateInputPosition)

  let kbOpen = function (open) {
    keyboardOpen = open
    updateInputPosition()
    if (open) keyInput.focus()
    else keyInput.blur()
  }

  qs('#term-kb-open').addEventListener('click', function () {
    kbOpen(true)
    return false
  })

  // Chrome for Android doesn't send proper keydown/keypress events with
  // real key values instead of 229 “Unidentified,” so here's a workaround
  // that deals with the input composition events.

  let lastCompositionString = ''
  let compositing = false

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

    if (e.key === 'Backspace') {
      e.preventDefault()
      input.sendString('\b')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      input.sendString('\x0d')
    }
  })

  keyInput.addEventListener('keypress', e => {
    // prevent key duplication on iOS (because Safari *does* send proper events)
    e.stopPropagation()
  })

  keyInput.addEventListener('input', e => {
    e.stopPropagation()

    if (e.isComposing) {
      sendInputDelta(e.data)
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
    compositing = true
  })

  keyInput.addEventListener('compositionend', e => {
    lastCompositionString = ''
    compositing = false
    keyInput.value = ''
  })

  screen.on('open-soft-keyboard', () => keyInput.focus())
}
