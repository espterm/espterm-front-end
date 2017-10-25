<div class="Box fold">
	<h2>Commands: System Functions</h2>

	<div class="Row v">
		<p>
			It's possible to dynamically change the screen title text and action button labels.
			Setting an empty label to a button makes it look disabled. The buttons send ASCII 1-5 when clicked.
			Those changes are not retained after restart.
		</p>

		<table class="ansiref w100">
			<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
			<tbody>
			<tr>
				<td>_CAN_ (24)</td>
				<td>
					This ASCII code is sent by ESPTerm when it becomes ready to receive commands.
					When this code is received on the UART, it means ESPTerm has restarted and is ready.
					Use this to detect spontaneous restarts which require a full screen repaint.
					As a control character sent to ESPTerm, CAN aborts any currently received commands
					and clears the parser.
				</td>
			</tr>
			<tr>
				<td>_ENQ_ (5)</td>
				<td>
					ESPTerm responds to this control characters with an "answerback message".
					This message contains the curretn version, unique ID, and the IP address if in Client mode.
				</td>
			</tr>
			<tr>
				<td>`\ec`</td>
				<td>
					Clear screen, reset attributes and cursor. This command also restores the default
					screen size, title, button labels and messages and the background URL.
				</td>
			</tr>
			<tr>
				<td>`\e[8;<i>r</i>;<i>c</i>t`</td>
				<td>Set screen size to _r_ rows and _c_ columns (this is a command borrowed from Xterm)</td>
			</tr>
			<tr>
				<td>`\e[5n`</td>
				<td>
					Query device status, ESPTerm replies with `\e[0n` "device is OK".
					Can be used to check if the terminal has booted up and is ready to receive commands.
				</td>
			</tr>
			<tr>
				<td>`\e[<i>n</i> q`</td>
				<td>
					Set cursor style: eg. `\e[3 q` (the space is part of the command!).
					0~-~block~(blink), 1~-~default, 2~-~block~(steady), 3~-~underline~(blink),
					4~-~underline~(steady), 5~-~I-bar~(blink), 6~-~I-bar~(steady). The default style (number 1)
					can be configured in Terminal Settings
				</td>
			</tr>
			<tr>
				<td>`\e]0;<i>t</i>\a`</td>
				<td>Set screen title to _t_ (this is a standard OSC command)</td>
			</tr>
			<tr>
				<td>`\e]27;1;<i>u</i>\a`</td>
				<td>
					Set background image to URL _u_ (including protocol)
					that can be resolved by the user's browser. The image will be scaled
					to fit the screen, preserving aspect ratio. A certain border must be added
					to account for the screen margins. Use empty string to disable the image feature.
					Note that this *won't work for users connected to the built-in AP*.
				</td>
			</tr>
			<tr>
				<td>`\e]27;2;<i>n</i>\a`</td>
				<td>
					Set number of visible buttons to _n_ (0-5). To hide/show the entire buttons bar,
					use the dedicated hiding commands (see below)
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e]28;<i>x</i>;<i>t</i>\a
					</code>
				</td>
				<td>
					Set label for button _x_ (1-5) to _t_ - e.g.`\e]28;1;Yes\a`
					sets the first button text to "Yes".
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e]29;<i>x</i>;<i>m</i>\a
					</code>
				</td>
				<td>
					Set message for button _x_ (1-5) to _m_ - e.g.`\e]29;3;+\a`
					sets the 3rd button to send "+" when pressed. The message can be up to
					10 bytes long.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e]9;<i>t</i>\a
					</code>
				</td>
				<td>
					Show a notification with text _t_. This will be either a desktop notification
					or a pop-up balloon.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[?<i>n</i>s \\
						\e[?<i>n</i>r
					</code>
				</td>
				<td>
					Save (`s`) and restore (`r`) any option set using `CSI ? <i>n</i> h`.
					This is used by some applications to back up the original state before
					making changes.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[?800h \\
						\e[?800l
					</code>
				</td>
				<td>
					Show (`h`) or hide (`l`) the action buttons (the blue buttons under the screen).
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[?801h \\
						\e[?801l
					</code>
				</td>
				<td>
					Show (`h`) or hide (`l`) menu/help links under the screen.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[?2004h \\
						\e[?2004l
					</code>
				</td>
				<td>
					Enable (`h`) or disable (`l`) Bracketed Paste mode.
					This mode makes any text sent using the Upload Tool be preceded by `\e[200\~`
					and terminated by `\e[201\~`. This is useful for distinguishing keyboard input
					from uploads.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[?1049h \\
						\e[?1049l
					</code>
				</td>
				<td>
					Switch to (`h`) or from (`l`) an alternate screen.
					ESPTerm can't implement this fully, so the original screen content is not saved,
					but it will remember the cursor, screen size, terminal title, button labels and messages.
				</td>
			</tr>
			<tr>
				<td>
					<code>
						\e[12h \\
						\e[12l
					</code>
				</td>
				<td>
					Enable (`h`) or disable (`l`) Send-Receive Mode (SRM).
					SRM is the opposite of Local Echo, meaning `\e[12h` disables and `\e[12l` enables Local Echo.
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</div>
