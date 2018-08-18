<div class="Box">
	<div noprint><a href="#" onclick="hpfold(1);return false">Expand all</a>&nbsp;|&nbsp;<a href="#" onclick="hpfold(0);return false">Collapse all</a><br>
	<span class="smallpad"></span>
	</div>
	<i>Note: This list of commands is not exhaustive. \\
	There's a more detailed and technical
	<a href="https://espterm.github.io/docs/espterm-xterm.html">document</a> available online.</i>
</div>

<?php require __DIR__ . "/help/troubleshooting.php"; ?>
<?php require __DIR__ . "/help/nomenclature.php"; ?>
<?php require __DIR__ . "/help/screen_behavior.php"; ?>
<?php require __DIR__ . "/help/input.php"; ?>
<?php require __DIR__ . "/help/charsets.php"; ?>
<?php require __DIR__ . "/help/sgr_styles.php"; ?>
<?php require __DIR__ . "/help/sgr_colors.php"; ?>
<?php require __DIR__ . "/help/cmd_cursor.php"; ?>
<?php require __DIR__ . "/help/cmd_screen.php"; ?>
<?php require __DIR__ . "/help/cmd_d2d.php"; ?>
<?php require __DIR__ . "/help/cmd_system.php"; ?>
<?php require __DIR__ . "/help/iocontrol.php"; ?>

<script>
	function hpfold(yes) {
		$('.fold').toggleClass('expanded', !!yes);
	}

	// show theme colors - but this is a static page, so we don't know the current theme.
    themes.themePreview(1)
</script>
