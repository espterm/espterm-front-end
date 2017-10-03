#! /usr/bin/env php
<?php

require_once __DIR__ . '/../base.php';

$selected = array_slice($argv, 1);

$output = [];

foreach ($selected as $key) {
  $output[$key] = tr($key);
}

fwrite(STDOUT, json_encode($output, JSON_UNESCAPED_UNICODE));
