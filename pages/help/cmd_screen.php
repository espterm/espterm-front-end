<div class="Box fold">
	<h2>Commands: Screen Functions</h2>

	<div class="Row v">
		<p>
			<b>Legend:</b>
			Italic letters such as _n_ are ASCII numbers that serve as arguments, separated with a semicolon.
			If an argument is left out, it's treated as 0 or 1, depending on what makes sense for the command.
		</p>

		<h3>Erasing &amp; Inserting</h3>

		<table class="ansiref w100">
			<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
			<tbody>
			<tr>
				<td>`\e[<i>m</i>J`</td>
				<td>
					Clear part of screen. _m_: 0 - from cursor, 1 - to cursor, 2 - all
				</td>
			</tr>
			<tr>
				<td>`\e[<i>m</i>K`</td>
				<td>
					Erase part of line. _m_: 0 - from cursor, 1 - to cursor, 2 - all
				</td>
			</tr>
			<tr>
				<td>`\e[<i>n</i>X`</td>
				<td>
					Erase _n_ characters in line.
				</td>
			</tr>
			<tr>
				<td><code>
					\e[<i>n</i>L \\
					\e[<i>n</i>M
				</code></td>
				<td>
					Insert (`L`) or delete (`M`) _n_ lines. Following lines are pulled up or pushed down.
				</td>
			</tr>
			<tr>
				<td><code>
					\e[<i>n</i>@ \\
					\e[<i>n</i>P
				</code></td>
				<td>
					Insert (`@`) or delete (`P`) _n_ characters. The rest of the line is pulled left or pushed right.
					Characters going past the end of line are lost.
				</td>
			</tr>
			</tbody>
		</table>

		<h3>Supersized lines</h3>

		<table class="ansiref w100">
			<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
			<tbody>
			<tr>
				<td>`\e#1`, `\e#2`</td>
				<td>
					Make the current line part of a double-height line.
					Use `1` for the top, `2` for the bottom half.
				</td>
			</tr>
			<tr>
				<td>`\e#3`, `\e#4`</td>
				<td>
					Make the current line part of a double-width, double-height line.
					Use `3` for the top, `4` for the bottom half.
				</td>
			</tr>
			<tr>
				<td>`\e#6`</td>
				<td>
					Make the current line double-width.
				</td>
			</tr>
			<tr>
				<td>`\e#5`</td>
				<td>
					Reset the current line to normal size.
				</td>
			</tr>
			</tbody>
		</table>

		<h3>Other</h3>

		<table class="ansiref w100">
			<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
			<tbody>
			<tr>
				<td>`\ec`</td>
				<td>
					Clear screen, reset attributes and cursor. This command also restores the default
					screen size, title, button labels and messages and the background URL.
				</td>
			</tr>
			<tr>
				<td><code>
					\e[?1049h \\
					\e[?1049l
				</code></td>
				<td>
					Switch to (`h`) or from (`l`) an alternate screen.
					ESPTerm can't implement this fully, so the original screen content is not saved,
					but it will remember the cursor, screen size, terminal title, button labels and messages.
				</td>
			</tr>
			<tr>
				<td>`\e[8;<i>r</i>;<i>c</i>t`</td>
				<td>Set screen size to _r_ rows and _c_ columns (this is a command borrowed from Xterm)</td>
			</tr>
			<tr>
				<td>
					`\e[<i>n</i>b`</td>
				<td>
					Repeat last printed characters _n_ times (moving cursor and using the current style).
				</td>
			</tr>
			<tr>
				<td>`\e#8`</td>
				<td>
					Reset all screen attributes to default and fill the screen with the letter "E". This was
					historically used for aligning CRT displays, now can be useful e.g. for testing erasing commands.
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</div>
