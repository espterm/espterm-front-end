<?php

if (preg_match('/\\/(?:js|css)/', $_SERVER["REQUEST_URI"])) {
  $path = pathinfo($_SERVER["REQUEST_URI"]);
  if ($path["extension"] == "js") {
    header("Content-Type: application/javascript");
  } else if ($path["extension"] == "css") {
    header("Content-Type: text/css");
  }
  readfile("out" . $_SERVER["REQUEST_URI"]);
} else {
  return false;
}
