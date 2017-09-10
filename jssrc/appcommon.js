/** Global generic init */
$.ready(function () {
  // Checkbox UI (checkbox CSS and hidden input with int value)
  $('.Row.checkbox').forEach(function (x) {
    let inp = x.querySelector('input')
    let box = x.querySelector('.box')

    $(box).toggleClass('checked', inp.value)

    let hdl = function () {
      inp.value = 1 - inp.value
      $(box).toggleClass('checked', inp.value)
    }

    $(x).on('click', hdl).on('keypress', cr(hdl))
  })

  // Expanding boxes on mobile
  $('.Box.mobcol,.Box.fold').forEach(function (x) {
    let h = x.querySelector('h2')

    let hdl = function () {
      $(x).toggleClass('expanded')
    }
    $(h).on('click', hdl).on('keypress', cr(hdl))
  })

  $('form').forEach(function (x) {
    $(x).on('keypress', function (e) {
      if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
        x.submit()
      }
    })
  })

  // loader dots...
  setInterval(function () {
    $('.anim-dots').each(function (x) {
      let $x = $(x)
      let dots = $x.html() + '.'
      if (dots.length == 5) dots = '.'
      $x.html(dots)
    })
  }, 1000)

  // flipping number boxes with the mouse wheel
  $('input[type=number]').on('mousewheel', function (e) {
    let $this = $(this)
    let val = +$this.val()
    if (isNaN(val)) val = 1

    const step = +($this.attr('step') || 1)
    const min = +$this.attr('min')
    const max = +$this.attr('max')
    if (e.wheelDelta > 0) {
      val += step
    } else {
      val -= step
    }

    if (typeof min != 'undefined') val = Math.max(val, +min)
    if (typeof max != 'undefined') val = Math.min(val, +max)
    $this.val(val)

    if ('createEvent' in document) {
      let evt = document.createEvent('HTMLEvents')
      evt.initEvent('change', false, true)
      $this[0].dispatchEvent(evt)
    } else {
      $this[0].fireEvent('onchange')
    }

    e.preventDefault()
  })

  let errAt = location.search.indexOf('err=')
  if (errAt !== -1 && qs('.Box.errors')) {
    let errs = location.search.substr(errAt + 4).split(',')
    let hres = []
    errs.forEach(function (er) {
      let lbl = qs('label[for="' + er + '"]')
      if (lbl) {
        lbl.classList.add('error')
        hres.push(lbl.childNodes[0].textContent.trim().replace(/: ?$/, ''))
      } else {
        hres.push(er)
      }
    })

    qs('.Box.errors .list').innerHTML = hres.join(', ')
    qs('.Box.errors').classList.remove('hidden')
  }

  Modal.init()
  Notify.init()

  // remove tabindixes from h2 if wide
  if (window.innerWidth > 550) {
    $('.Box h2').forEach(function (x) {
      x.removeAttribute('tabindex')
    })

    // brand works as a link back to term in widescreen mode
    let br = qs('#brand')
    br && br.addEventListener('click', function () {
      location.href = '/' // go to terminal
    })
  }
})

$._loader = function (vis) {
  $('#loader').toggleClass('show', vis)
}

function showPage () {
  $('#content').addClass('load')
}

$.ready(function () {
  if (window.noAutoShow !== true) {
    setTimeout(function () {
      showPage()
    }, 1)
  }
})
