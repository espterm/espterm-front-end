<div class="Box fold">
	<h2>Remote GPIO Control</h2>

	<div class="Row v">
		<p>
			ESPTerm provides a simple API to remotely control and read GPIO pins GPIO2, GPIO4, and GPIO5.
			The main use of this API is to remotely reset a device that communicates with ESPTerm
			through the UART.
		</p>
		
		<p>
			GPIO2 is normally used for debug UART, so when used as GPIO, debug logging is disabled. You
			can configure the pin functions in <a href="<?= url('cfg_system') ?>">System Settings</a>.
    </p>

		<p>
			The GPIO control endpoint is `/api/v1/gpio`, with optional GET arguments:
		</p>

		<ul>
			<li>`do2=<i>x</i>` - set GPIO2 level. <i>x</i> can be `0`, `1`, or `t` to toggle the pin.
			<li>`do4=<i>x</i>` - set GPIO4 level
			<li>`do5=<i>x</i>` - set GPIO5 level
			<li>`pulse=<i>ms</i>` - the command starts a pulse. After the given amount of time 
			  (milliseconds) has elapsed, the pins are set to the opposite levels than what was specified 
			  (in the case of toggle, the original pin state)
		</ul>

		<p>
		  A quick example: <a href="/api/v1/gpio?do4=1&amp;pulse=500">`/api/v1/gpio?do4=1&amp;pulse=500`</a>
		  sends a 500ms long positive pulse on GPIO4.
		</p>

		<p>
			The GPIO endpoint always returns a JSON object like this: `{"io2":0,"io4":1,"io5":0}`, showing
			the current input levels. Input reading works always, regardless of the GPIO settings.
		</p>
	</div>
</div>
