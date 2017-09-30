#!/bin/bash

cd $(dirname $0)

source "_build_common.sh"

rm -fr out/*

./_build_css.sh
./_build_js.sh $@
./_build_html.sh $@
./_build_assets.sh

echo 'ESPTerm front-end ready'
