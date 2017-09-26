const $ = require('./lib/chibi')
const modal = require('./modal')

let nt = {}
const sel = '#notif'
let $balloon

let timerHideBegin // timeout to start hiding (transition)
let timerHideEnd // timeout to add the hidden class
let canCancel = false

let stopTimeouts = function () {
  clearTimeout(timerHideBegin)
  clearTimeout(timerHideEnd)
}

nt.show = function (message, timeout, isError) {
  $balloon.toggleClass('error', isError === true)
  $balloon.html(message)
  modal.show($balloon)
  stopTimeouts()

  if (!timeout || timeout <= 0) {
    timeout = 2500
  }

  timerHideBegin = setTimeout(nt.hide, timeout)

  canCancel = false
  setTimeout(() => {
    canCancel = true
  }, 500)
}

nt.hide = function () {
  let $m = $(sel)
  $m.removeClass('visible')
  timerHideEnd = setTimeout(function () {
    $m.addClass('hidden')
  }, 250) // transition time
}

nt.init = function () {
  $balloon = $(sel)

  // close by click outside
  $(document).on('click', function () {
    if (!canCancel) return
    nt.hide(this)
  })

  // click caused by selecting, prevent it from bubbling
  $balloon.on('click', function (e) {
    e.stopImmediatePropagation()
    return false
  })

  // stop fading if moused
  $balloon.on('mouseenter', function () {
    stopTimeouts()
    $balloon.removeClass('hidden').addClass('visible')
  })
}

module.exports = nt
