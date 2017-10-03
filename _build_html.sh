#!/bin/bash
source "_build_common.sh"

echo 'Building HTML...'

php ./compile_html.php $@
