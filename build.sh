#!/bin/bash

echo 'Packing JS...'
npm run babel -- -o js/app.js --source-maps jssrc/lib \
    jssrc/lib/chibi.js \
    jssrc/lib/keymaster.js \
    jssrc/lib/polyfills.js \
    jssrc/utils.js \
    jssrc/modal.js \
    jssrc/notif.js \
    jssrc/appcommon.js \
    jssrc/lang.js \
    jssrc/wifi.js \
    jssrc/term_* \
    jssrc/term.js \
    jssrc/soft_keyboard.js

echo 'Building CSS...'

npm run sass -- --output-style compressed sass/app.scss css/app.css

echo 'Building HTML...'

rm out/*
php ./dump_js_lang.php
php ./compile_html.php

echo 'ESPTerm front-end ready'
