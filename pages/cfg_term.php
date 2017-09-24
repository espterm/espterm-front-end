<div class="Box">
	<a href="<?= e(url('reset_screen')) ?>"><?= tr('term.reset_screen') ?></a>
</div>

<form class="Box mobopen str" action="<?= e(url('term_set')) ?>" method="GET" id='form-scheme'>
	<h2><?= tr('term.color_scheme') ?></h2>

	<div class="Row explain">
		<?= tr('term.explain_scheme') ?>
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
		<label><?= tr("term.color_bg_prev") ?></label>
		<div>
			<div class="colorprev bg">
				<span data-bg=0 data-fg=15>0</span><!--
				--><span data-bg=1 data-fg=15>1</span><!--
				--><span data-bg=2 data-fg=15>2</span><!--
				--><span data-bg=3 data-fg=0>3</span><!--
				--><span data-bg=4 data-fg=15>4</span><!--
				--><span data-bg=5 data-fg=15>5</span><!--
				--><span data-bg=6 data-fg=15>6</span><!--
				--><span data-bg=7 data-fg=0>7</span>
			</div>

			<div class="colorprev bg">
				<span data-bg=8 data-fg=15>8</span><!--
				--><span data-bg=9 data-fg=0>9</span><!--
				--><span data-bg=10 data-fg=0>10</span><!--
				--><span data-bg=11 data-fg=0>11</span><!--
				--><span data-bg=12 data-fg=0>12</span><!--
				--><span data-bg=13 data-fg=0>13</span><!--
				--><span data-bg=14 data-fg=0>14</span><!--
				--><span data-bg=15 data-fg=0>15</span>
			</div>
		</div>
	</div>

	<div class="Row color-preview">
		<label><?= tr("term.color_fg_prev") ?></label>
		<div>
			<div class="colorprev fg">
				<span data-fg=0 data-bg=0 style="text-shadow: 0 0 4px white;">0</span><!--
				--><span data-fg=1 data-bg=0>1</span><!--
				--><span data-fg=2 data-bg=0>2</span><!--
				--><span data-fg=3 data-bg=0>3</span><!--
				--><span data-fg=4 data-bg=0>4</span><!--
				--><span data-fg=5 data-bg=0>5</span><!--
				--><span data-fg=6 data-bg=0>6</span><!--
				--><span data-fg=7 data-bg=0>7</span>
			</div>

			<div class="colorprev fg">
				<span data-fg=8 data-bg=0>8</span><!--
				--><span data-fg=9 data-bg=0>9</span><!--
				--><span data-fg=10 data-bg=0>10</span><!--
				--><span data-fg=11 data-bg=0>11</span><!--
				--><span data-fg=12 data-bg=0>12</span><!--
				--><span data-fg=13 data-bg=0>13</span><!--
				--><span data-fg=14 data-bg=0>14</span><!--
				--><span data-fg=15 data-bg=0>15</span>
			</div>
		</div>
	</div>

	<div class="Row color-preview">
		<label><?= tr("term.colors_preview") ?></label>
		<div class="color-example" data-fg="" data-bg="">
			<?= tr("term.example") ?>
		</div>
	</div>

	<div class="Row color-preview">
		<label><?= tr("term.fgbg_presets") ?></label>
		<div id="fgbg_presets"></div>
	</div>

	<div class="Row">
		<div class="SubRow">
			<label for="default_fg"><?= tr("term.color_fg") ?></label>
			<input type="text" name="default_fg" id="default_fg" class="short" value="%default_fg%">
		</div>
		<div class="SubRow">
			<label for="default_bg"><?= tr("term.color_bg") ?></label>
			<input type="text" name="default_bg" id="default_bg" class="short" value="%default_bg%">
		</div>
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
		<a class="button icn-ok" href="#" onclick="qs('#form-scheme').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<form class="Box fold str" action="<?= e(url('term_set')) ?>" method="GET" id='form-initial'>
	<h2><?= tr('term.defaults') ?></h2>

	<div class="Row explain">
		<?= tr('term.explain_initials') ?>
	</div>

	<div class="Row">
		<div class="SubRow">
			<label for="term_width"><?= tr('term.term_width') ?></label>
			<input type="number" step=1 min=1 max=255 name="term_width" id="term_width" value="%term_width%" required>
		</div>
		<div class="SubRow">
			<label for="term_height"><?= tr('term.term_height') ?></label>
			<input type="number" step=1 min=1 max=255 name="term_height" id="term_height" value="%term_height%" required>
		</div>
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
		<input class="tiny" type="text" name="btn1" id="btn1" value="%h:btn1%">
		<input class="tiny" type="text" name="btn2" id="btn2" value="%h:btn2%">
		<input class="tiny" type="text" name="btn3" id="btn3" value="%h:btn3%">
		<input class="tiny" type="text" name="btn4" id="btn4" value="%h:btn4%">
		<input class="tiny" type="text" name="btn5" id="btn5" value="%h:btn5%">
	</div>

	<div class="Row">
		<label><?= tr("term.button_msgs") ?></label>
		<input class="tiny" type="text" name="bm1" id="bm1" value="%h:bm1%">
		<input class="tiny" type="text" name="bm2" id="bm2" value="%h:bm2%">
		<input class="tiny" type="text" name="bm3" id="bm3" value="%h:bm3%">
		<input class="tiny" type="text" name="bm4" id="bm4" value="%h:bm4%">
		<input class="tiny" type="text" name="bm5" id="bm5" value="%h:bm5%">
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
			<?php
			foreach([
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
			<?php
			foreach([
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
			<?php
			foreach([
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
	$('#cursor_shape').val(%cursor_shape%);
	$('#theme').val(%theme%);

    $('#uart_baud').val(%uart_baud%);
    $('#uart_parity').val(%uart_parity%);
    $('#uart_stopbits').val(%uart_stopbits%);

	function showColor() {
		var ex = qs('.color-example');
		var fg = $('#default_fg').val();
		var bg = $('#default_bg').val();

		if (/^\d+$/.test(fg)) fg = +fg;
		else if (!/^#[\da-f]{3,6}$/i.test(fg)) {
		  fg = 'black';
		}

		if (/^\d+$/.test(bg)) bg = +bg;
		else if (!/^#[\da-f]{3,6}$/i.test(bg)) {
		  bg = 'black';
		}

		ex.dataset.fg = fg;
		ex.dataset.bg = bg;

		themes.themePreview(+$('#theme').val())
	}
	showColor();

	$('#default_fg').on('input', showColor)
	$('#default_bg').on('input', showColor)

	$('.colorprev.bg span').on('click', function() {
		var bg = this.dataset.bg;
		if (typeof bg != 'undefined') $('#default_bg').val(bg);
		showColor()
	});

	$('.colorprev.fg span').on('click', function() {
		var fg = this.dataset.fg;
		if (typeof fg != 'undefined') $('#default_fg').val(fg);
		showColor()
	});

	var $presets = $('#fgbg_presets');
	for(var i = 0; i < themes.fgbgThemes.length; i++) {
	  fg = themes.fgbgThemes[i][0];
	  bg = themes.fgbgThemes[i][1];
      $presets
        .htmlAppend(
          '<span class="preset" ' +
          'data-xfg="'+fg+'" data-xbg="'+bg+'" ' +
          'style="color:'+fg+';background:'+bg+'">&nbsp;['+i+']&nbsp;</span>');

	  if ((i+1)%5==0) $presets.htmlAppend('<br>');
	}

	$('.preset').on('click', function() {
      $('#default_fg').val(this.dataset.xfg)
      $('#default_bg').val(this.dataset.xbg)
      showColor()
	});
</script>
