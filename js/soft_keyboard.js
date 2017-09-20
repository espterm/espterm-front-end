const { qs } = require('./utils')

module.exports = function (screen, input) {
  const keyInput = qs('#softkb-input')
  if (!keyInput) return // abort, we're not on the terminal page

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
  })

  keyInput.addEventListener('blur', () => (keyboardOpen = false))

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
}
