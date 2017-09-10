(function (w) {
  const authStr = ['Open', 'WEP', 'WPA', 'WPA2', 'WPA/WPA2']
  let curSSID

  // Get XX % for a slider input
  function rangePt (inp) {
    return Math.round(((inp.value / inp.max) * 100)) + '%'
  }

  // Display selected STA SSID etc
  function selectSta (name, password, ip) {
    $('#sta_ssid').val(name)
    $('#sta_password').val(password)

    $('#sta-nw').toggleClass('hidden', name.length === 0)
    $('#sta-nw-nil').toggleClass('hidden', name.length > 0)

    $('#sta-nw .essid').html(esc(name))
    const nopw = undef(password) || password.length === 0
    $('#sta-nw .passwd').toggleClass('hidden', nopw)
    $('#sta-nw .nopasswd').toggleClass('hidden', !nopw)
    $('#sta-nw .ip').html(ip.length > 0 ? tr('wifi.connected_ip_is') + ip : tr('wifi.not_conn'))
  }

  /** Update display for received response */
  function onScan (resp, status) {
    // var ap_json = {
    //  "result": {
    //    "inProgress": "0",
    //    "APs": [
    //      {"essid": "Chlivek", "bssid": "88:f7:c7:52:b3:99", "rssi": "204", "enc": "4", "channel": "1"},
    //      {"essid": "TyNikdy", "bssid": "5c:f4:ab:0d:f1:1b", "rssi": "164", "enc": "3", "channel": "1"},
    //    ]
    //  }
    // };

    if (status !== 200) {
      // bad response
      rescan(5000) // wait 5sm then retry
      return
    }

    try {
      resp = JSON.parse(resp)
    } catch (e) {
      console.log(e)
      rescan(5000)
      return
    }

    const done = !bool(resp.result.inProgress) && (resp.result.APs.length > 0)
    rescan(done ? 15000 : 1000)
    if (!done) return // no redraw yet

    // clear the AP list
    let $list = $('#ap-list')
    // remove old APs
    $('#ap-list .AP').remove()

    $list.toggleClass('hidden', !done)
    $('#ap-loader').toggleClass('hidden', done)

    // scan done
    resp.result.APs.sort(function (a, b) {
      return b.rssi - a.rssi
    }).forEach(function (ap) {
      ap.enc = parseInt(ap.enc)

      if (ap.enc > 4) return // hide unsupported auths

      let item = mk('div')

      let $item = $(item)
        .data('ssid', ap.essid)
        .data('pwd', ap.enc)
        .attr('tabindex', 0)
        .addClass('AP')

      // mark current SSID
      if (ap.essid === curSSID) {
        $item.addClass('selected')
      }

      let inner = mk('div')
      let escapedSSID = $.htmlEscape(ap.essid)
      $(inner).addClass('inner')
        .htmlAppend(`<div class="rssi">${ap.rssi_perc}</div>`)
        .htmlAppend(`<div class="essid" title="${escapedSSID}">${escapedSSID}</div>`)
        .htmlAppend(`<div class="auth">${authStr[ap.enc]}</div>`)

      $item.on('click', function () {
        let $th = $(this)

        const conn_ssid = $th.data('ssid')
        let conn_pass = ''

        if (+$th.data('pwd')) {
          // this AP needs a password
          conn_pass = prompt(tr('wifi.enter_passwd').replace(':ssid:', conn_ssid))
          if (!conn_pass) return
        }

        $('#sta_password').val(conn_pass)
        $('#sta_ssid').val(conn_ssid)
        selectSta(conn_ssid, conn_pass, '')
      })

      item.appendChild(inner)
      $list[0].appendChild(item)
    })
  }

  function startScanning () {
    $('#ap-loader').removeClass('hidden')
    $('#ap-scan').addClass('hidden')
    $('#ap-loader .anim-dots').html('.')

    scanAPs()
  }

  /** Ask the CGI what APs are visible (async) */
  function scanAPs () {
    if (_demo) {
      onScan(_demo_aps, 200)
    } else {
      $.get('http://' + _root + '/cfg/wifi/scan', onScan)
    }
  }

  function rescan (time) {
    setTimeout(scanAPs, time)
  }

  /** Set up the WiFi page */
  function wifiInit (cfg) {
    // Update slider value displays
    $('.Row.range').forEach(function (x) {
      let inp = x.querySelector('input')
      let disp1 = x.querySelector('.x-disp1')
      let disp2 = x.querySelector('.x-disp2')
      let t = rangePt(inp)
      $(disp1).html(t)
      $(disp2).html(t)
      $(inp).on('input', function () {
        t = rangePt(inp)
        $(disp1).html(t)
        $(disp2).html(t)
      })
    })

    // Forget STA credentials
    $('#forget-sta').on('click', function () {
      selectSta('', '', '')
      return false
    })

    selectSta(cfg.sta_ssid, cfg.sta_password, cfg.sta_active_ip)
    curSSID = cfg.sta_active_ssid
  }

  w.init = wifiInit
  w.startScanning = startScanning
})(window.WiFi = {})
