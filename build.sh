#!/bin/bash

echo 'Packing JS...'

echo ';' > ';'
cat jssrc/lib/chibi.js ';' \
    jssrc/lib/keymaster.js ';' \
    jssrc/lib/polyfills.js ';' \
    jssrc/utils.js ';' \
    jssrc/modal.js ';' \
    jssrc/notif.js ';' \
    jssrc/appcommon.js ';' \
    jssrc/lang.js ';' \
    jssrc/wifi.js ';' \
    jssrc/term_* ';' \
    jssrc/term.js ';' \
    jssrc/soft_keyboard.js | npm run --silent minify > js/app.js
rm ';'

echo 'Building CSS...'

npm run sass -- --output-style compressed sass/app.scss css/app.css

echo 'Building HTML...'

php ./dump_js_lang.php
php ./compile_html.php

echo 'ESPTerm front-end ready'
