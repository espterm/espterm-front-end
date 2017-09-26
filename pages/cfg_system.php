<div class="Box str mobcol">
	<h2 tabindex=0><?= tr('system.save_restore') ?></h2>

	<div class="Row explain nomargintop">
		<?= tr('system.explain_persist') ?>
	</div>

	<div class="Row buttons2">
		<a class="button icn-restore"
		   onclick="return confirm('<?= tr('system.confirm_restore') ?>');"
		   href="<?= e(url('restore_defaults')) ?>">
			<?= tr('system.restore_defaults') ?>
		</a>
	</div>

	<div class="Row buttons2">
		<a onclick="writeDefaults(); return false;" href="#"><?= tr('system.write_defaults') ?></a>
	</div>

	<div class="Row buttons2">
		<a onclick="return confirm('<?= tr('system.confirm_restore_hard') ?>');"
		   href="<?= e(url('restore_hard')) ?>">
			<?= tr('system.restore_hard') ?>
		</a><br>
		<?= tr('system.restore_hard_explain') ?>
	</div>
</div>

<?php
$NOFILL = 'readonly onfocus="this.removeAttribute(\'readonly\')" style="cursor:text" autocomplete="off"';
?>

<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-2">
	<h2 tabindex=0><?= tr('system.security') ?></h2>

	<div class="Row explain">
		<?= tr('system.explain_security') ?>
	</div>

	<div class="Row">
		<label for="pwlock"><?= tr("system.pwlock") ?></label>
		<select name="pwlock" id="pwlock">
			<option value="0"><?= tr("system.pwlock.none") ?></option>
			<option value="1"><?= tr("system.pwlock.settings_noterm") ?></option>
			<option value="2"><?= tr("system.pwlock.settings") ?></option>
			<option value="3"><?= tr("system.pwlock.menus") ?></option>
			<option value="4"><?= tr("system.pwlock.all") ?></option>
		</select>
	</div>

	<div class="Row">
		<label for="access_name"><?= tr('system.access_name') ?></label>
		<input type="text" name="access_name" id="access_name" value="%h:access_name%">
	</div>

	<div class="Row">
		<label for="access_pw"><?= tr('system.new_access_pw') ?></label>
		<input type="password" name="access_pw" id="access_pw" <?=$NOFILL?>>
	</div>

	<div class="Row">
		<label for="access_pw2"><?= tr('system.new_access_pw2') ?></label>
		<input type="password" name="access_pw2" id="access_pw2" <?=$NOFILL?>>
	</div>

	<div class="Row">
		<label for="pw"><?= tr('system.admin_pw') ?></label>
		<input type="password" name="pw" id="pw" required>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-2').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<form class="Box str mobcol" action="<?= e(url('system_set')) ?>" method="GET" id="form-3">
	<h2 tabindex=0><?= tr('system.change_adminpw') ?></h2>

	<div class="Row explain">
		<?= tr('system.explain_adminpw') ?>
	</div>

	<div class="Row">
		<label for="admin_pw"><?= tr('system.new_admin_pw') ?></label>
		<input type="password" name="admin_pw" id="admin_pw">
	</div>

	<div class="Row">
		<label for="admin_pw2"><?= tr('system.new_admin_pw2') ?></label>
		<input type="password" name="admin_pw2" id="admin_pw2">
	</div>

	<div class="Row">
		<label for="pw"><?= tr('system.old_admin_pw') ?></label>
		<input type="password" name="pw" id="pw" required>
	</div>

	<div class="Row buttons">
		<a class="button icn-ok" href="#" onclick="qs('#form-3').submit()"><?= tr('apply') ?></a>
	</div>
</form>

<script>
	function writeDefaults() {
		var pw = prompt('<?= tr('system.confirm_store_defaults') ?>');
		if (!pw) return;
		location.href = <?=json_encode(url('write_defaults')) ?> + '?pw=' + pw;
	}

	$('#pwlock').val(%pwlock%);
</script>
