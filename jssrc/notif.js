window.Notify = (function () {
  let nt = {}
  const sel = '#notif'

  let hideTmeo1 // timeout to start hiding (transition)
  let hideTmeo2 // timeout to add the hidden class

  nt.show = function (message, timeout) {
    $(sel).html(message)
    Modal.show(sel)

    clearTimeout(hideTmeo1)
    clearTimeout(hideTmeo2)

    if (undef(timeout)) timeout = 2500

    hideTmeo1 = setTimeout(nt.hide, timeout)
  }

  nt.hide = function () {
    let $m = $(sel)
    $m.removeClass('visible')
    hideTmeo2 = setTimeout(function () {
      $m.addClass('hidden')
    }, 250) // transition time
  }

  nt.init = function () {
    $(sel).on('click', function () {
      nt.hide(this)
    })
  }

  return nt
})()
