#!/bin/bash
source "_build_common.sh"

echo 'Copying resources...'

cp -r img out/img
cp favicon.ico out/

if [[ $ESP_PROD ]]; then
	echo 'Cleaning junk files...'
	find out/ -name "*.orig" -delete
	find out/ -name "*.xcf"  -delete
	find out/ -name "*~"     -delete
	find out/ -name "*.bak"  -delete
	find out/ -name "*.map"  -delete
fi
