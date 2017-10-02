#!/bin/bash
source "_build_common.sh"

echo 'Building CSS...'

if [[ $ESP_PROD ]]; then
	stylearg=compressed
else
	stylearg=expanded
fi

mkdir -p out/css
npm run sass -- --output-style ${stylearg} sass/app.scss "out/css/app.$FRONT_END_HASH-$ESP_LANG.css"
