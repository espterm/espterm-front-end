<!-- Persist -->
<div class="Box str mobcol">
	<h2 tabindex=0><?= tr('persist.title') ?></h2>

	<div class="Row explain nomargintop">
		<?= tr('persist.explain') ?>
	</div>

	<div class="Row buttons2">
		<a class="button icn-restore"
		   onclick="return confirm('<?= e(tr('persist.confirm_restore')) ?>');"
		   href="<?= e(url('restore_defaults')) ?>">
			<?= tr('persist.restore_defaults') ?>
		</a>
	</div>

	<div class="Row buttons2">
		<a onclick="writeDefaults(); return false;" href="#"><?= tr('persist.write_defaults') ?></a>
	</div>

	<div class="Row buttons2">
		<a onclick="return confirm('<?= e(tr('persist.confirm_restore_hard')) ?>');"
		   href="<?= e(url('restore_hard')) ?>">
			<?= tr('persist.restore_hard') ?>
		</a><br>
		<?= tr('persist.restore_hard_explain') ?>
	</div>
</div>

<!-- Backup -->
<div class="Box str mobcol">
	<h2 tabindex=0><?= tr('backup.title') ?></h2>

	<div class="Row explain nomargintop">
		<?= tr('backup.explain') ?>
	</div>

	<div class="Row buttons2">
		<a class="button"
		   href="<?= e(url('ini_export')) ?>">
			<?= tr('backup.export') ?>
		</a>
	</div>

	<div class="Row buttons2">
		<form method="POST" action="<?= e(url('ini_import')) ?>" enctype='multipart/form-data'>
			<span class="filewrap"><input accept=".ini,text/plain" type="file" name="file"></span><!--
			--><input type="submit" value="<?= tr('backup.import') ?>">
		</form>
	</div>
</div>

<!-- Overclock -->
<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-hw">
	<h2 tabindex=0><?= tr('hwtuning.title') ?></h2>

	<div class="Row explain">
		<?= tr('hwtuning.explain') ?>
	</div>

	<div class="Row checkbox" >
		<label><?= tr('hwtuning.overclock') ?></label><!--
		--><span class="box" tabindex=0 role=checkbox></span>
		<input type="hidden" id="overclock" name="overclock" value="%overclock%">
	</div>
	
	<div class="Row">
		<label for="gpio2_conf"><?= tr("gpio2_config") ?></label>
		<select name="gpio2_conf" id="gpio2_conf">
			<option value="0"><?= tr("gpio_config.off_2") ?></option>
			<option value="1"><?= tr("gpio_config.out_initial0") ?></option>
			<option value="2"><?= tr("gpio_config.out_initial1") ?></option>
			<option value="3"><?= tr("gpio_config.in_pull") ?></option>
			<option value="4"><?= tr("gpio_config.in_nopull") ?></option>
		</select>
	</div>
	
	<div class="Row">
		<label for="gpio4_conf"><?= tr("gpio4_config") ?></label>
		<select name="gpio4_conf" id="gpio4_conf">
			<option value="0"><?= tr("gpio_config.off") ?></option>
			<option value="1"><?= tr("gpio_config.out_initial0") ?></option>
			<option value="2"><?= tr("gpio_config.out_initial1") ?></option>
			<option value="3"><?= tr("gpio_config.in_pull") ?></option>
			<option value="4"><?= tr("gpio_config.in_nopull") ?></option>
		</select>
	</div>
	
	<div class="Row">
		<label for="gpio5_conf"><?= tr("gpio5_config") ?></label>
		<select name="gpio5_conf" id="gpio5_conf">
			<option value="0"><?= tr("gpio_config.off") ?></option>
			<option value="1"><?= tr("gpio_config.out_initial0") ?></option>
			<option value="2"><?= tr("gpio_config.out_initial1") ?></option>
			<option value="3"><?= tr("gpio_config.in_pull") ?></option>
			<option value="4"><?= tr("gpio_config.in_nopull") ?></option>
		</select>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-hw').submit()"><?= tr('apply') ?></a>
	</div>
</form>


<?php
$NOFILL = 'readonly onfocus="this.removeAttribute(\'readonly\')" style="cursor:text" autocomplete="off"';
?>

<!-- Access perms -->
<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-access">
	<h2 tabindex=0><?= tr('pwlock.title') ?></h2>

	<div class="Row explain">
		<?= tr('pwlock.explain') ?>
	</div>

	<div class="Row">
		<label for="pwlock"><?= tr("pwlock.region") ?></label>
		<select name="pwlock" id="pwlock">
			<option value="0"><?= tr("pwlock.region.none") ?></option>
			<option value="1"><?= tr("pwlock.region.settings_noterm") ?></option>
			<option value="2"><?= tr("pwlock.region.settings") ?></option>
			<option value="3"><?= tr("pwlock.region.menus") ?></option>
			<option value="4"><?= tr("pwlock.region.all") ?></option>
		</select>
	</div>

	<div class="Row">
		<label for="access_name"><?= tr('pwlock.access_name') ?></label>
		<input type="text" name="access_name" id="access_name" value="%h:access_name%">
	</div>

	<div class="Row">
		<label for="access_pw"><?= tr('pwlock.new_access_pw') ?></label>
		<input type="password" name="access_pw" id="access_pw" <?=$NOFILL?>>
	</div>

	<div class="Row">
		<label for="access_pw2"><?= tr('pwlock.new_access_pw2') ?></label>
		<input type="password" name="access_pw2" id="access_pw2" <?=$NOFILL?>>
	</div>

	<div class="Row">
		<label for="pw"><?= tr('pwlock.admin_pw') ?></label>
		<input type="password" name="pw" id="pw" required>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-access').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<!-- Admin pw -->
<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-admin">
	<h2 tabindex=0><?= tr('adminpw.title') ?></h2>

	<div class="Row explain">
		<?= tr('adminpw.explain') ?>
	</div>

	<div class="Row">
		<label for="admin_pw"><?= tr('adminpw.new_admin_pw') ?></label>
		<input type="password" name="admin_pw" id="admin_pw">
	</div>

	<div class="Row">
		<label for="admin_pw2"><?= tr('adminpw.new_admin_pw2') ?></label>
		<input type="password" name="admin_pw2" id="admin_pw2">
	</div>

	<div class="Row">
		<label for="pw"><?= tr('adminpw.old_admin_pw') ?></label>
		<input type="password" name="pw" id="pw" required>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-admin').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<script>
	function writeDefaults() {
		var pw = prompt('<?= tr('persist.confirm_store_defaults') ?>');
		if (!pw) return;
		location.href = <?=json_encode(url('write_defaults')) ?> + '?pw=' + pw;
	}

	$('#pwlock').val(%pwlock%);
	$('#gpio2_conf').val(%gpio2_conf%);
	$('#gpio4_conf').val(%gpio4_conf%);
	$('#gpio5_conf').val(%gpio5_conf%);
</script>
