<nav id="menu">
	<div id="brand" tabindex=0><?= tr('appname'.(ESP_DEMO?'_demo':'')) ?></div>
	<a href="<?= e(url('term')) ?>" class="icn-back"><?= tr('menu.term') ?></a>
	<?php
	// generate the menu
	foreach ($_pages as $k => $page) {
		if (strpos($page->bodyclass, 'cfg') === false) continue;

		$sel = ($_GET['page'] == $k) ? 'selected' : '';
		$text = $page->label;
		$url = e(url($k));
		echo "<a href=\"$url\" class=\"$page->icon $sel\">$text</a>";
	}
	?>
</nav>
