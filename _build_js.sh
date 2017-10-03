#!/bin/bash
source "_build_common.sh"

mkdir -p out/js

echo 'Processing JS...'
npm run webpack
