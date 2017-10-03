const $ = require('../lib/chibi')
const { qs } = require('../utils')
const modal = require('../modal')

/** File upload utility */
module.exports = function (conn, input, screen) {
  let lines, // array of lines without newlines
    line_i, // current line index
    fuTout, // timeout handle for line sending
    send_delay_ms, // delay between lines (ms)
    nl_str, // newline string to use
    curLine, // current line (when using fuOil)
    inline_pos // Offset in line (for long lines)

  // lines longer than this are split to chunks
  // sending a super-ling string through the socket is not a good idea
  const MAX_LINE_LEN = 128

  function openUploadDialog () {
    updateStatus('Ready...')
    modal.show('#fu_modal', onDialogClose)
    $('#fu_form').toggleClass('busy', false)
    input.blockKeys(true)
  }

  function onDialogClose () {
    console.log('Upload modal closed.')
    clearTimeout(fuTout)
    line_i = 0
    input.blockKeys(false)
  }

  function updateStatus (msg) {
    qs('#fu_prog').textContent = msg
  }

  function startUpload () {
    let v = qs('#fu_text').value
    if (!v.length) {
      fuClose()
      return
    }

    lines = v.split('\n')
    line_i = 0
    inline_pos = 0 // offset in line
    send_delay_ms = +qs('#fu_delay').value

    // sanitize - 0 causes overflows
    if (send_delay_ms < 0) {
      send_delay_ms = 0
      qs('#fu_delay').value = send_delay_ms
    }

    nl_str = {
      'CR': '\r',
      'LF': '\n',
      'CRLF': '\r\n'
    }[qs('#fu_crlf').value]

    $('#fu_form').toggleClass('busy', true)
    updateStatus('Starting...')
    uploadLine()
  }

  function uploadLine () {
    if (!$('#fu_modal').hasClass('visible')) {
      // Modal is closed, cancel
      return
    }

    if (!conn.canSend()) {
      // postpone
      fuTout = setTimeout(uploadLine, 1)
      return
    }

    if (inline_pos === 0) {
      curLine = ''
      if (line_i === 0) {
        if (screen.bracketedPaste) {
          curLine = '\x1b[200~'
        }
      }

      curLine += lines[line_i++] + nl_str

      if (line_i === lines.length) {
        if (screen.bracketedPaste) {
          curLine += '\x1b[201~'
        }
      }
    }

    let maxChunk = +qs('#fu_chunk').value
    if (maxChunk === 0 || maxChunk > MAX_LINE_LEN) {
      maxChunk = MAX_LINE_LEN
    }

    let chunk
    if ((curLine.length - inline_pos) <= maxChunk) {
      chunk = curLine.substr(inline_pos, maxChunk)
      inline_pos = 0
    } else {
      chunk = curLine.substr(inline_pos, maxChunk)
      inline_pos += maxChunk
    }

    if (!input.sendString(chunk)) {
      updateStatus('FAILED!')
      return
    }

    let pt = Math.round((line_i / lines.length) * 1000) / 10
    updateStatus(`${line_i} / ${lines.length} (${pt}%)`)

    if (lines.length > line_i || inline_pos > 0) {
      fuTout = setTimeout(uploadLine, send_delay_ms)
    } else {
      closeWhenReady()
    }
  }

  function closeWhenReady () {
    if (!conn.canSend()) {
      // stuck in XOFF still, wait to process...
      updateStatus('Waiting for Tx buffer...')
      setTimeout(closeWhenReady, 100)
    } else {
      updateStatus('Done.')
      // delay to show it
      fuClose()
    }
  }

  function fuClose () {
    modal.hide('#fu_modal')
  }

  return {
    init: function () {
      qs('#fu_file').addEventListener('change', function (evt) {
        let reader = new window.FileReader()
        let file = evt.target.files[0]
        let ftype = file.type || 'application/octet-stream'
        console.log('Selected file type: ' + ftype)
        if (!ftype.match(/text\/.*|application\/(json|csv|.*xml.*|.*script.*|x-php)/)) {
          // Deny load of blobs like img - can crash browser and will get corrupted anyway
          if (!window.confirm(`This does not look like a text file: ${ftype}\nReally load?`)) {
            qs('#fu_file').value = ''
            return
          }
        }
        reader.onload = function (e) {
          const txt = e.target.result.replace(/[\r\n]+/, '\n')
          qs('#fu_text').value = txt
        }
        console.log('Loading file...')
        reader.readAsText(file)
      }, false)

      qs('#term-fu-open').addEventListener('click', e => {
        e.preventDefault()
        openUploadDialog()
      })

      qs('#term-fu-start').addEventListener('click', e => {
        e.preventDefault()
        startUpload()
      })

      qs('#term-fu-close').addEventListener('click', e => {
        e.preventDefault()
        fuClose()
      })
    },
    open: openUploadDialog,
    setContent (content) {
      qs('#fu_text').value = content
    }
  }
}
