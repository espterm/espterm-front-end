<?php if (!DEBUG): ?>
<script>
	// Workaround for badly loaded page
	setTimeout(function() {
		if (typeof termInit == 'undefined' || typeof $ == 'undefined') {
			console.error("Page load failed, refreshing…");
			location.reload(true);
		}
	}, 3000);
</script>
<?php endif; ?>

<div class="Modal light hidden" id="fu_modal">
	<div id="fu_form" class="Dialog">
		<div class="fu-content">
			<h2>Text Upload</h2>
			<p>
				<label for="fu_file">Load a text file:</label>
				<input type="file" id="fu_file" accept="text/*" /><br>
				<textarea id="fu_text"></textarea>
			</p>
			<p>
				<label for="fu_crlf">Line Endings:</label>
				<select id="fu_crlf">
					<option value="CR">CR (Enter key)</option>
					<option value="CRLF">CR LF (Windows)</option>
					<option value="LF">LF (Linux)</option>
				</select>
			</p>
			<p>
				<label for="fu_delay">Line Delay (ms):</label>
				<input id="fu_delay" type="number" value=1 min=0>
			</p>
		</div>
		<div class="fu-buttons">
			<button onclick="TermUpl.start()" class="icn-ok x-fu-go">Start</button>&nbsp;
			<button onclick="TermUpl.close()" class="icn-cancel x-fu-cancel">Cancel</button>&nbsp;
			<i class="fu-prog-box">Upload: <span id="fu_prog"></span></i>
		</div>
	</div>
</div>

<h1><!-- Screen title gets loaded here by JS --></h1>

<div id="term-wrap">
	<div id="screen">
		<input id="softkb-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
		<div id="touch-select-menu">
			<button id="touch-select-copy-btn">Copy</button>
		</div>
	</div>

	<div id="action-buttons">
		<button data-n="1"></button><!--
		--><button data-n="2"></button><!--
		--><button data-n="3"></button><!--
		--><button data-n="4"></button><!--
		--><button data-n="5"></button>
	</div>
</div>

<nav id="term-nav">
	<a href="#" onclick="toggleFitScreen();return false" class="mq-tablet-max"><i id="resize-button-icon" class="icn-resize-small"></i></a><!--
	--><a href="#" onclick="kbOpen(true);return false" class="mq-tablet-max"><i class="icn-keyboard"></i><span><?= tr('term_nav.keybd') ?></span></a><!--
	--><a href="#" onclick="TermUpl.open();return false"><i class="icn-download"></i><span><?= tr('term_nav.upload') ?></span></a><!--
	--><a href="<?= url('cfg_term') ?>" class="x-term-conf-btn"><i class="icn-configure"></i><span><?= tr('term_nav.config') ?></span></a><!--
	--><a href="<?= url('cfg_wifi') ?>" class="x-term-conf-btn"><i class="icn-wifi"></i><span><?= tr('term_nav.wifi') ?></span></a><!--
	--><a href="<?= url('help') ?>" class="x-term-conf-btn"><i class="icn-help"></i><span><?= tr('term_nav.help') ?></span></a><!--
	--><a href="<?= url('about') ?>" class="x-term-conf-btn"><i class="icn-about"></i><span><?= tr('term_nav.about') ?></span></a>
</nav>

<script>
	try {
		termInit('%j:labels_seq%', +'%theme%');
	} catch(e) {
		console.error(e);
		<?php if (!DEBUG): ?>
		console.error("Fail, reloading in 3s…");
		setTimeout(function() {
			location.reload(true);
		}, 3000);
		<?php endif; ?>
	}
</script>
