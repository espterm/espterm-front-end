<div class="Box">
	<a href="<?= e(url('reset_screen')) ?>"><?= tr('term.reset_screen') ?></a>
</div>

<form class="Box mobopen str" action="<?= e(url('term_set')) ?>" method="GET" id='form-initial'>
	<h2><?= tr('term.defaults') ?></h2>

	<div class="Row explain">
		<?= tr('term.explain_initials') ?>
	</div>

	<div class="Row">
		<label for="theme"><?= tr("term.theme") ?></label>
		<select name="theme" id="theme" class="short" onchange="showColor()">
			<option value="0">Tango</option>
			<option value="1">Linux (CGA)</option>
			<option value="2">XTerm</option>
			<option value="3">Rxvt</option>
			<option value="4">Ambience</option>
			<option value="5">Solarized</option>
			<option value="6">CGA NTSC</option>
			<option value="7">ZX Spectrum</option>
			<option value="8">Apple II</option>
			<option value="9">Commodore</option>
		</select>
	</div>

	<div class="Row color-preview">
		<div class="colorprev">
			<span data-fg=0 data-bg="0" style="text-shadow: 0 0 4px white;">30</span><!--
			--><span data-fg=1 data-bg="0">31</span><!--
			--><span data-fg=2 data-bg="0">32</span><!--
			--><span data-fg=3 data-bg="0">33</span><!--
			--><span data-fg=4 data-bg="0">34</span><!--
			--><span data-fg=5 data-bg="0">35</span><!--
			--><span data-fg=6 data-bg="0">36</span><!--
			--><span data-fg=7 data-bg="0">37</span>
		</div>

		<div class="colorprev">
			<span data-fg=8 data-bg="0">90</span><!--
			--><span data-fg=9 data-bg="0">91</span><!--
			--><span data-fg=10 data-bg="0">92</span><!--
			--><span data-fg=11 data-bg="0">93</span><!--
			--><span data-fg=12 data-bg="0">94</span><!--
			--><span data-fg=13 data-bg="0">95</span><!--
			--><span data-fg=14 data-bg="0">96</span><!--
			--><span data-fg=15 data-bg="0">97</span>
		</div>

		<div class="colorprev">
			<span data-bg=0 data-fg="15">40</span><!--
			--><span data-bg=1 data-fg="15">41</span><!--
			--><span data-bg=2 data-fg="15">42</span><!--
			--><span data-bg=3 data-fg="0">43</span><!--
			--><span data-bg=4 data-fg="15">44</span><!--
			--><span data-bg=5 data-fg="15">45</span><!--
			--><span data-bg=6 data-fg="15">46</span><!--
			--><span data-bg=7 data-fg="0">47</span>
		</div>

		<div class="colorprev">
			<span data-bg=8 data-fg="15">100</span><!--
			--><span data-bg=9 data-fg="0">101</span><!--
			--><span data-bg=10 data-fg="0">102</span><!--
			--><span data-bg=11 data-fg="0">103</span><!--
			--><span data-bg=12 data-fg="0">104</span><!--
			--><span data-bg=13 data-fg="0">105</span><!--
			--><span data-bg=14 data-fg="0">106</span><!--
			--><span data-bg=15 data-fg="0">107</span>
		</div>
	</div>

	<div class="Row color-preview">
		<div id="color-example" data-fg="" data-bg="">
			<?= tr("term.example") ?>
		</div>
	</div>

	<div class="Row">
		<label><?= tr("term.default_fg_bg") ?></label>
		<select name="default_fg" id="default_fg" class="short" onchange="showColor()">
			<?php for($i=0; $i<16; $i++): ?>
			<option value="<?=$i?>"><?= tr("color.$i") ?></option>
			<?php endfor; ?>
		</select>&nbsp;<!--
		--><select name="default_bg" id="default_bg" class="short" onchange="showColor()">
			<?php for($i=0; $i<16; $i++): ?>
			<option value="<?=$i?>"><?= tr("color.$i") ?></option>
			<?php endfor; ?>
		</select>
	</div>

	<div class="Row">
		<label for="term_width"><?= tr('term.term_width') ?></label>
		<input type="number" step=1 min=1 max=255 name="term_width" id="term_width" value="%term_width%" required>&nbsp;<!--
		--><input type="number" step=1 min=1 max=255 name="term_height" id="term_height" value="%term_height%" required>
	</div>

	<div class="Row">
		<label for="term_title"><?= tr('term.term_title') ?></label>
		<input type="text" name="term_title" id="term_title" value="%h:term_title%" required>
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.show_buttons') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="show_buttons" name="show_buttons" value="%show_buttons%">
	</div>

	<div class="Row">
		<label><?= tr("term.buttons") ?></label>
		<input class="short" type="text" name="btn1" id="btn1" value="%h:btn1%">&nbsp;
		<input class="short" type="text" name="btn2" id="btn2" value="%h:btn2%">&nbsp;
		<input class="short" type="text" name="btn3" id="btn3" value="%h:btn3%">&nbsp;
		<input class="short" type="text" name="btn4" id="btn4" value="%h:btn4%">&nbsp;
		<input class="short" type="text" name="btn5" id="btn5" value="%h:btn5%">
	</div>

	<div class="Row">
		<label><?= tr("term.cursor_shape") ?></label>
		<select name="cursor_shape" id="cursor_shape">
			<option value="0"><?= tr("cursor.block_blink") ?></option>
			<option value="2"><?= tr("cursor.block_steady") ?></option>
			<option value="3"><?= tr("cursor.underline_blink") ?></option>
			<option value="4"><?= tr("cursor.underline_steady") ?></option>
			<option value="5"><?= tr("cursor.bar_blink") ?></option>
			<option value="6"><?= tr("cursor.bar_steady") ?></option>
		</select>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-initial').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<form class="Box fold str" action="<?= e(url('term_set')) ?>" method="GET" id="form-uart">
	<h2 tabindex=0><?= tr('system.uart') ?></h2>

	<div class="Row explain">
		<?= tr('system.explain_uart') ?>
	</div>

	<div class="Row">
		<label for="uart_baud"><?= tr('uart.baud') ?><span class="mq-phone">&nbsp;(bps)</span></label>
		<select name="uart_baud" id="uart_baud" class="short">
			<?php foreach([
				              300, 600, 1200, 2400, 4800, 9600, 19200, 38400,
				              57600, 74880, 115200, 230400, 460800, 921600, 1843200, 3686400,
			              ] as $b):
				?><option value="<?=$b?>"><?= number_format($b, 0, ',', '.') ?></option>
			<?php endforeach; ?>
		</select>
		<span class="mq-no-phone">&nbsp;bps</span>
	</div>

	<div class="Row">
		<label for="uart_parity"><?= tr('uart.parity') ?></label>
		<select name="uart_parity" id="uart_parity" class="short">
			<?php foreach([
				              2 => tr('uart.parity.none'),
				              1 => tr('uart.parity.odd'),
				              0 => tr('uart.parity.even'),
			              ] as $k => $label):
				?><option value="<?=$k?>"><?=$label?></option>
			<?php endforeach; ?>
		</select>
	</div>

	<div class="Row">
		<label for="uart_stopbits"><?= tr('uart.stop_bits') ?></label>
		<select name="uart_stopbits" id="uart_stopbits" class="short">
			<?php foreach([
				              1 => tr('uart.stop_bits.one'),
				              2 => tr('uart.stop_bits.one_and_half'),
				              3 => tr('uart.stop_bits.two'),
			              ] as $k => $label):
				?><option value="<?=$k?>"><?=$label?></option>
			<?php endforeach; ?>
		</select>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-uart').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<form class="Box fold str" action="<?= e(url('term_set')) ?>" method="GET" id='form-expert'>
	<h2><?= tr('term.expert') ?></h2>

	<div class="Row explain">
		<?= tr('term.explain_expert') ?>
	</div>

	<div class="Row">
		<label for="parser_tout_ms"><?= tr('term.parser_tout_ms') ?><span class="mq-phone">&nbsp;(ms)</span></label>
		<input type="number" step=1 min=0 name="parser_tout_ms" id="parser_tout_ms" value="%parser_tout_ms%" required>
		<span class="mq-no-phone">&nbsp;ms</span>
	</div>

	<div class="Row">
		<label for="display_tout_ms"><?= tr('term.display_tout_ms') ?><span class="mq-phone">&nbsp;(ms)</span></label>
		<input type="number" step=1 min=0 name="display_tout_ms" id="display_tout_ms" value="%display_tout_ms%" required>
		<span class="mq-no-phone">&nbsp;ms</span>
	</div>

	<div class="Row">
		<label for="display_cooldown_ms"><?= tr('term.display_cooldown_ms') ?><span class="mq-phone">&nbsp;(ms)</span></label>
		<input type="number" step=1 min=0 name="display_cooldown_ms" id="display_cooldown_ms" value="%display_cooldown_ms%" required>
		<span class="mq-no-phone">&nbsp;ms</span>
	</div>

	<div class="Row">
		<label><?= tr("term.button_msgs") ?></label>
		<input class="short" type="text" name="bm1" id="bm1" value="%h:bm1%">&nbsp;
		<input class="short" type="text" name="bm2" id="bm2" value="%h:bm2%">&nbsp;
		<input class="short" type="text" name="bm3" id="bm3" value="%h:bm3%">&nbsp;
		<input class="short" type="text" name="bm4" id="bm4" value="%h:bm4%">&nbsp;
		<input class="short" type="text" name="bm5" id="bm5" value="%h:bm5%">
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.fn_alt_mode') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="fn_alt_mode" name="fn_alt_mode" value="%fn_alt_mode%">
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.want_all_fn') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="want_all_fn" name="want_all_fn" value="%want_all_fn%">
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.crlf_mode') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="crlf_mode" name="crlf_mode" value="%crlf_mode%">
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.show_config_links') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="show_config_links" name="show_config_links" value="%show_config_links%">
	</div>

	<div class="Row checkbox" >
		<label><?= tr('term.loopback') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="loopback" name="loopback" value="%loopback%">
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-expert').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<script>
	$('#default_fg').val(%default_fg%);
	$('#default_bg').val(%default_bg%);
	$('#cursor_shape').val(%cursor_shape%);
	$('#theme').val(%theme%);

    $('#uart_baud').val(%uart_baud%);
    $('#uart_parity').val(%uart_parity%);
    $('#uart_stopbits').val(%uart_stopbits%);

	function showColor() {
		var ex = qs('#color-example');
		ex.dataset.fg = +$('#default_fg').val();
		ex.dataset.bg = +$('#default_bg').val();
		themes.themePreview(+$('#theme').val())
	}
	showColor();

	$('.colorprev span').on('click', function() {
		var fg = this.dataset.fg;
		var bg = this.dataset.bg;
		if (typeof fg != 'undefined') $('#default_fg').val(fg);
		if (typeof bg != 'undefined') $('#default_bg').val(bg);
		showColor()
	});
</script>
