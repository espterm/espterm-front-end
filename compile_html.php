<?php

require_once __DIR__ . '/base.php';

function process_html($s) {
	$pattern = '/<!--(.*)-->/Uis';
	$s = preg_replace($pattern, '', $s);

	$pattern = '/(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\|\'|\")\/\/.*))/';
	$s = preg_replace($pattern, '', $s);

	$pattern = '/\s+/s';
	$s = preg_replace($pattern, ' ', $s);
	return $s;
}

$no_tpl_files = ['help', 'cfg_wifi_conn'];

$dest = __DIR__ . '/out/';

ob_start();
foreach($_pages as $_k => $p) {
	if ($p->bodyclass == 'api') {
		if (ESP_DEMO) {
			echo "Generating: ~$_k.html (bounce)\n";

			if ($_k=='index') {
				$s = "<!DOCTYPE HTML><meta http-equiv=\"refresh\" content=\"0;url=term.html\">";
			}
			else {
				$s = "<!DOCTYPE HTML>
			<script>
				var ref = document.referrer;
				var qat = document.referrer.indexOf('?');
				if (qat !== -1) ref = ref.substring(0, qat)
				location.href=ref+'?msg=Request ignored, this is a demo.';
			</script>";
			}


		} else {
			continue;
		}
	} else {
		echo "Generating: $_k ($p->title)\n";

		$_GET['page'] = $_k;
		ob_flush();                                   // print the message
		ob_clean();                                   // clean up
		include(__DIR__ . '/index.php');
		$s = ob_get_contents();                       // grab the output

		// remove newlines and comments
		// as tests have shown, it saves just a couple kilobytes,
		// making it not a very big improvement at the expense of ugly html.
		//	$s = process_html($s);
		ob_clean();
	}

	$outputPath = $dest . $_k . ((in_array($_k, $no_tpl_files)||ESP_DEMO) ? '.html' : '.tpl');

	if (file_exists($outputPath)) unlink($outputPath);
	if (ESP_PROD) {
		$tmpfile = tempnam('/tmp', 'espterm').'.html';
		file_put_contents($tmpfile, $s);
		// using https://github.com/tdewolff/minify
		system('minify --html-keep-default-attrvals '.
			'-o '.escapeshellarg($outputPath).' '.
			''.escapeshellarg($tmpfile), $rv);

		// fallback if minify is not installed
		if (!file_exists($outputPath)) file_put_contents($outputPath, $s);
	} else {
		file_put_contents($outputPath, $s);
	}
}

ob_flush();
