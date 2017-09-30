#!/bin/bash
source "_build_common.sh"

mkdir -p out/js
echo 'Generating lang.js...'
php ./dump_js_lang.php $@

echo 'Processing JS...'
npm run webpack
