<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-gpio">
	<input type="hidden" name="redir" value="/cfg/gpio">
	<h2><?= tr('gpio_config.title_config') ?></h2>

	<?php foreach([2,4,5] as $n): ?>
		<div class="Row">
			<label for="gpio<?=$n?>_conf"><?= tr("gpiox_config", [':x' => $n]) ?></label>
			<select name="gpio<?=$n?>_conf" id="gpio<?=$n?>_conf">
				<option value="0"><?= tr("gpio_config.off" . ($n==2?'_2':'')) ?></option>
				<option value="1"><?= tr("gpio_config.out_initial0") ?></option>
				<option value="2"><?= tr("gpio_config.out_initial1") ?></option>
				<option value="3"><?= tr("gpio_config.in_pull") ?></option>
				<option value="4"><?= tr("gpio_config.in_nopull") ?></option>
			</select>
		</div>
	<?php endforeach; ?>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-gpio').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<div class="Box str">
	<h2><?= tr('gpio_config.title_control') ?></h2>

	<div class="Row explain nomargintop">
		<?= tr('gpio_config.explain') ?>
	</div>

	<?php foreach([2,4,5] as $n): ?>
		<div class="Row x-iorow-<?=$n?>">
			<label class="x-in-handle" data-num="<?=$n?>" tabindex="0">
				<?= tr("gpiox_level", [':x' => $n]) ?>

				<span class="gpio-indicator x-in<?=$n?>" data-num="<?=$n?>"></span>
			</label>
		</div>
	<?php endforeach; ?>
</div>

<script>
  GPIO_Ctl.init(%gpio_initial%, %gpio2_conf%>2 || %gpio4_conf%>2 || %gpio5_conf%>2)

  $('#gpio2_conf').val(%gpio2_conf%);
  if (%gpio2_conf% === 0) $('.x-iorow-2').addClass('hidden');

  $('#gpio4_conf').val(%gpio4_conf%);
  if (%gpio4_conf% === 0) $('.x-iorow-4').addClass('hidden');

  $('#gpio5_conf').val(%gpio5_conf%);
  if (%gpio5_conf% === 0) $('.x-iorow-5').addClass('hidden');
</script>
