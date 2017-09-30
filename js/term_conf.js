const ColorTriangle = require('./lib/colortriangle')
const $ = require('./lib/chibi')
const themes = require('./term/themes')
const { qs } = require('./utils')

function selectedTheme () {
  return +$('#theme').val()
}

exports.init = function () {
  $('#theme').on('change', showColor)

  $('#default_fg').on('input', showColor)
  $('#default_bg').on('input', showColor)

  let opts = {
    padding: 10,
    event: 'drag',
    uppercase: true,
    trianglePointerSize: 20,
    // wheelPointerSize: 12,
    size: 200,
    parseColor: (color) => {
      return themes.toHex(color, selectedTheme())
    }
  }

  ColorTriangle.initInput(qs('#default_fg'), opts)
  ColorTriangle.initInput(qs('#default_bg'), opts)

  $('.colorprev.bg span').on('click', function () {
    const bg = this.dataset.bg
    if (typeof bg != 'undefined') $('#default_bg').val(bg)
    showColor()
  })

  $('.colorprev.fg span').on('click', function () {
    const fg = this.dataset.fg
    if (typeof fg != 'undefined') $('#default_fg').val(fg)
    showColor()
  })

  let $presets = $('#fgbg_presets')
  for (let i = 0; i < themes.fgbgThemes.length; i++) {
    const thm = themes.fgbgThemes[i]
    const fg = thm[0]
    const bg = thm[1]
    const lbl = thm[2]
    const tit = thm[3]
    $presets.htmlAppend(
        '<span class="preset" ' +
        'data-xfg="' + fg + '" data-xbg="' + bg + '" ' +
        'style="color:' + fg + ';background:' + bg + '" title="' + tit + '">&nbsp;' + lbl + '&nbsp;</span>')

    if ((i + 1) % 5 === 0) $presets.htmlAppend('<br>')
  }

  $('.preset').on('click', function () {
    $('#default_fg').val(this.dataset.xfg)
    $('#default_bg').val(this.dataset.xbg)
    showColor()
  })

  showColor()
}

function showColor () {
  let ex = qs('.color-example')
  let fg = $('#default_fg').val()
  let bg = $('#default_bg').val()

  if (/^\d+$/.test(fg)) {
    fg = +fg
  } else if (!/^#[\da-f]{6}$/i.test(fg)) {
    fg = 'black'
  }

  if (/^\d+$/.test(bg)) {
    bg = +bg
  } else if (!/^#[\da-f]{6}$/i.test(bg)) {
    bg = 'black'
  }

  const themeN = selectedTheme()
  ex.dataset.fg = fg
  ex.dataset.bg = bg

  themes.themePreview(themeN)

  $('.colorprev.fg span').css('background', themes.toHex(bg, themeN))
}

exports.nextTheme = () => {
  let sel = qs('#theme')
  let i = sel.selectedIndex
  sel.options[++i % sel.options.length].selected = true
  showColor()
}

exports.prevTheme = () => {
  let sel = qs('#theme')
  let i = sel.selectedIndex
  sel.options[(sel.options.length + (--i)) % sel.options.length].selected = true
  showColor()
}
