import {cr} from './utils'

const $ = require('./lib/chibi')

const HTTPS = window.location.protocol.match(/s:/)

const PERIOD_NORMAL = 500
const PERIOD_FAIL = 2500

const w = window.GPIO_Ctl = {}

let scheduledSampleTimeout = null
let lastState = {'io2': -1, 'io4': -1, 'io5': -1}

let $in2, $in4, $in5

let enablePolling

function scheduleSample (time) {
  if (!enablePolling || window._demo) return // no scanning in demo mode

  clearTimeout(scheduledSampleTimeout)
  scheduledSampleTimeout = setTimeout(sampleGPIOs, time)
}

function onSampled (resp, status) {
  if (status !== 200) {
    // bad response
    scheduleSample(PERIOD_FAIL) // wait 5s then retry
    return
  }

  try {
    if (typeof resp !== 'object') resp = JSON.parse(resp)

    if (resp.io2 !== lastState.io2) $in2.toggleClass('active', resp.io2)
    if (resp.io4 !== lastState.io4) $in4.toggleClass('active', resp.io4)
    if (resp.io5 !== lastState.io5) $in5.toggleClass('active', resp.io5)
  } catch (e) {
    console.log(e)
    scheduleSample(PERIOD_FAIL)
    return
  }

  lastState = resp

  scheduleSample(PERIOD_NORMAL)
}

function sampleGPIOs (getargs = '') {
  clearTimeout(scheduledSampleTimeout)
  $.get(`${HTTPS ? 'https' : 'http'}://${window._root}/api/v1/gpio${getargs}`, onSampled, {loader: getargs !== ''})
}

w.init = function (state, doPoll) {

  $in2 = $('.x-in2')
  $in4 = $('.x-in4')
  $in5 = $('.x-in5')

  enablePolling = doPoll

  $('.gpio-indicator, .x-in-handle')
    .on('click', function (e) {
      let num = $(this).data('num')
      sampleGPIOs(`?do${num}=${1 - lastState['io' + num]}`)
    })

  $('.x-in-handle')
    .on('keypress', cr(function (e) {
      let num = $(this).data('num')
      sampleGPIOs(`?do${num}=${1 - lastState['io' + num]}`)
    }))

  onSampled(state, 200)
}
