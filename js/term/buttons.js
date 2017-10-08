const { qs } = require('../utils')

module.exports = function initButtons (input) {
  let container = qs('#action-buttons')

  // button labels
  let labels = []

  // button elements
  let buttons = []

  // add a button element
  let pushButton = function pushButton () {
    let button = document.createElement('button')
    button.classList.add('action-button')
    button.setAttribute('data-n', buttons.length)
    buttons.push(button)
    container.appendChild(button)

    button.addEventListener('click', e => {
      // might as well use the attribute ¯\_(ツ)_/¯
      let index = +button.getAttribute('data-n')
      input.sendButton(index)

      e.target.blur() // if it keeps focus, spacebar will push it
    })

    // this prevents button retaining focus after half-click/drag-away
    button.addEventListener('mouseleave', e => {
      e.target.blur()
    })

    return button
  }

  // remove a button element
  let popButton = function popButton () {
    let button = buttons.pop()
    button.parentNode.removeChild(button)
  }

  // sync with DOM
  let update = function updateButtons () {
    if (labels.length > buttons.length) {
      for (let i = buttons.length; i < labels.length; i++) {
        pushButton()
      }
    } else if (buttons.length > labels.length) {
      for (let i = labels.length; i <= buttons.length; i++) {
        popButton()
      }
    }

    for (let i = 0; i < labels.length; i++) {
      let label = labels[i].trim()
      let button = buttons[i]
      button.textContent = label || '\u00a0' // label or nbsp
      if (!label) button.classList.add('inactive')
      else button.classList.remove('inactive')
    }
  }

  return {
    update,
    get labels () {
      return labels
    },
    set labels (value) {
      labels = value
      update()
    }
  }
}
