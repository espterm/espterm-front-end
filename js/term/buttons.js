const { getColor } = require('./themes')
const { qs } = require('../utils')
const { rgb2hsl, hex2rgb, rgb2hex, hsl2rgb } = require('../lib/color_utils')

module.exports = function initButtons (input) {
  let container = qs('#action-buttons')

  // current color palette
  let palette = []

  // button labels
  let labels = []

  // button colors
  let colors = {}

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
      for (let i = buttons.length; i > labels.length; i--) {
        popButton()
      }
    }

    for (let i = 0; i < labels.length; i++) {
      let label = labels[i].trim()
      let button = buttons[i]
      let color = colors[i]

      button.textContent = label || '\u00a0' // label or nbsp

      if (!label) button.classList.add('inactive')
      else button.classList.remove('inactive')

      // 0 or undefined can be used to disable custom color
      if (Number.isFinite(color) && color !== 0) {
        const clr = getColor(color, palette)
        button.style.background = clr

        // darken the color a bit for the 3D side
        const hsl = rgb2hsl(...hex2rgb(clr))
        const hex = rgb2hex(...hsl2rgb(hsl[0], hsl[1], hsl[2] * 0.7))
        button.style.boxShadow = `0 3px 0 ${hex}`
      } else {
        button.style.background = null
        button.style.boxShadow = null
      }
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
    },
    get colors () {
      return colors
    },
    set colors (value) {
      colors = value
      update()
    },
    get palette () {
      return palette
    },
    set palette (value) {
      palette = value
      update()
    }
  }
}
