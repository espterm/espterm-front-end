window.initSoftKeyboard = function (screen) {
  const input = qs('#softkb-input')
  if (!input) return // abort, we're not on the terminal page

  let keyboardOpen = false

  let updateInputPosition = function () {
    if (!keyboardOpen) return

    let [x, y] = screen.gridToScreen(screen.cursor.x, screen.cursor.y, true)
    input.style.transform = `translate(${x}px, ${y}px)`
  }

  input.addEventListener('focus', () => {
    keyboardOpen = true
    updateInputPosition()
  })

  input.addEventListener('blur', () => (keyboardOpen = false))

  screen.on('cursor-moved', updateInputPosition)

  window.kbOpen = function openSoftKeyboard (open) {
    keyboardOpen = open
    updateInputPosition()
    if (open) input.focus()
    else input.blur()
  }

  let lastCompositionString = ''
  let compositing = false

  let sendInputDelta = function (newValue) {
    let resend = false
    if (newValue.length > lastCompositionString.length) {
      if (newValue.startsWith(lastCompositionString)) {
        // characters have been added at the end
        Input.sendString(newValue.substr(lastCompositionString.length))
      } else resend = true
    } else if (newValue.length < lastCompositionString.length) {
      if (lastCompositionString.startsWith(newValue)) {
        // characters have been removed at the end
        Input.sendString('\b'.repeat(lastCompositionString.length -
          newValue.length))
      } else resend = true
    } else if (newValue !== lastCompositionString) resend = true

    if (resend) {
      // the entire string changed; resend everything
      Input.sendString('\b'.repeat(lastCompositionString.length) +
        newValue)
    }
    lastCompositionString = newValue
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Unidentified') return

    input.value = ''

    if (e.key === 'Backspace') {
      e.preventDefault()
      Input.sendString('\b')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      Input.sendString('\x0d')
    }
  })

  input.addEventListener('input', e => {
    e.stopPropagation()

    if (e.isComposing) {
      sendInputDelta(e.data)
    } else {
      if (e.inputType === 'insertCompositionText') Input.sendString(e.data)
      else if (e.inputType === 'deleteContentBackward') {
        lastCompositionString = ''
        sendInputDelta('')
      } else if (e.inputType === 'insertText') {
        // this is a sane event, which means the keypress handler will get it
      }
    }
  })

  input.addEventListener('compositionstart', e => {
    lastCompositionString = ''
    compositing = true
    console.log('compositionstart')
  })

  input.addEventListener('compositionend', e => {
    lastCompositionString = ''
    compositing = false
    input.value = ''
    console.log('compositionend')
  })

  screen.on('open-soft-keyboard', () => input.focus())
}
