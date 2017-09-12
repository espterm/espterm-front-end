#!/bin/bash
source "_build_common.sh"

echo 'Building CSS...'

mkdir -p out/css
npm run sass -- --output-style compressed sass/app.scss "out/css/app.$FRONT_END_HASH.css"
