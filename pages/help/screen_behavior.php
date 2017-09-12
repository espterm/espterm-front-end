<div class="Box fold">
	<h2>Screen Behavior & Refreshing</h2>

	<div class="Row v">
		<p>
			The initial screen size, title text and button labels can be configured
			in <a href="<?= url('cfg_term') ?>">Terminal Settings</a>.
		</p>

		<p>
			Screen updates are sent to the browser through a WebSocket after some time of inactivity on the communication UART
			(called "Redraw Delay"). After an update is sent, at least a time of "Redraw Cooldown" must elapse before the next
			update can be sent. Those delays are used is to avoid burdening the server with tiny updates during a large screen
			repaint. If you experience issues (broken image due to dropped bytes), try adjusting those config options. It may also
			be useful to try different baud rates.
		</p>

		<h3>UTF-8 support</h3>

		<p>
			ESPTerm supports all UTF-8 characters, but to reduce the screen buffer RAM size,
			only a small amount of unique multi-byte characters can be used at the same time
			(up to 160, depending on compile flags). Unique multi-byte characters are stored in a
			look-up table and are removed when they are no longer used on the screen. In
			rare cases it can happen that a character stays in the table after no longer
			being used (this can be noticed when the table fills up and new characters
			are not shown correctly). This is fixed by clearing the screen (`\e[2J` or `\ec`).
		</p>
	</div>
</div>
