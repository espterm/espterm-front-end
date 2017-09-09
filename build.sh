#!/bin/bash

echo "Packing JS..."

cat jssrc/chibi.js \
  jssrc/keymaster.js \
  jssrc/utils.js \
  jssrc/modal.js \
  jssrc/notif.js \
  jssrc/appcommon.js \
  jssrc/lang.js \
  jssrc/wifi.js \
  jssrc/term_* \
  jssrc/term.js > js/app-full.js

yuicompressor js/app-full.js > js/app.js

echo "Building CSS..."

sass --style=compressed sass/app.scss css/app.css

echo "Building HTML..."
php ./build_html.php

echo "ESPTerm front-end ready"
