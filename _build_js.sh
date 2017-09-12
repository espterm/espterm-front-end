#!/bin/bash
source "_build_common.sh"

mkdir -p out/js
echo 'Generating lang.js...'
php ./dump_js_lang.php

echo 'Processing JS...'
npm run babel -- -o "out/js/app.$FRONT_END_HASH.js" --source-maps js/lib \
    js/lib/chibi.js \
    js/lib/keymaster.js \
    js/lib/polyfills.js \
    js/utils.js \
    js/modal.js \
    js/notif.js \
    js/appcommon.js \
    js/demo.js \
    js/lang.js \
    js/wifi.js \
    js/term_* \
    js/debug_screen.js \
    js/soft_keyboard.js \
    js/term.js
