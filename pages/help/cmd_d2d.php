<div class="Box fold">
	<h2>Commands: Networking</h2>

	<div class="Row v">
		<p>
			ESPTerm implements commands for device-to-device messaging and for requesting external
			servers. This can be used e.g. for remote control, status reporting or data upload / download.
		</p>

		<p>
			Networking commands use the format `\e^...\a`, a Privacy Message (PM).
			PM is similar to OSC, which uses `]` in place of `^`. The PM payload (text between `\e^` and `\a`)
			must be shorter than 256 bytes,	and should not contain any control characters (ASCII < 32).
		</p>

		<h3>Device-to-device Messaging</h3>

		<p>
			To send a message to another ESPTerm module, use: `\e^M;<i>DestIP</i>;<i>message</i>\a`.
		</p>

		<p>
			This command sends a POST request to `http://<i>&lt;DestIP&gt;</i>/api/v1/msg`.
			The IP address may be appended by a port, if needed (eg. :8080). In addition to POST,
			a GET request can also be used. In that case, any GET arguments (`/api/v1/msg?<i>arguments</i>`)
			will be used instead of the request body. This is intended for external access
			when sending POST requests is not convenient.
		</p>

		<p>
			Each ESPTerm listens for such requests and relays them to UART:
			`\e^m;<i>SrcIP</i>;L=<i>length</i>;<i>message</i>\a`, with _length_ being the byte length of
			_message_, as ASCII.
		</p>

		<p>
			Notice a pattern with the first letter: capital is always a command, lower case a response.
			This is followed with the HTTP commands and any networking commands added in the future.
		</p>

		<p>
			*Example:* Node 192.168.0.10 sends a message to 192.168.0.19: `\e^M;192.168.0.19;Hello\a`.
			Node 192.168.0.19 receives `\e^m;192.168.0.10;L=5;Hello\a` on the UART. Note that the IP
			address in the reception message is that of the first node, thus it can be used to send a message back.
		</p>

		<h3>External HTTP requests</h3>

		<p>
			To request an external server, use `\e^H;<i>method</i>;<i>options</i>;<i>url</i>\n<i>body</i>\a`.
		</p>

		<ul>
			<li>`_method_` - can be any usual HTTP verb, such as `GET`, `POST`, `PUT`, `HEAD`.
			<li>`_options_` - is a comma-separated list of flags and parameters:
				<ul>
					<li>`H` - get response headers
					<li>`B` - get response body
					<li>`X` - ignore the response, return nothing
					<li>`T=<i>ms</i>` - request timeout (default 5000~ms), in milliseconds
					<li>`L=<i>bytes</i>` - limit response length (default 0 = don't limit). Applies to the head, body, or both combined, depending on the `H` and `B` flags
					<li>`l=<i>bytes</i>` - limit the response buffer size (default 5000~B).
						This can reduce RAM usage, however it shouldn't be set too small, as this buffer
						is used for both headers and the response body.
				</ul>
			<li>`_url_` - full request URL, including `http://`. Port may be specified if different from :80,
				and GET arguments may be appended to the URL if needed.
			<li>`_body_` - optional, separated from `_url_` by a single line feed character (`\n`).
				This can be used for POST and PUT requests. Note: the command may be truncated to the
				maximum total length of 256 characters if too long.
		</ul>

		<p>The response has the following format: `\e^h;<i>status</i>;<i>options</i>;<i>response</i>\a`</p>

		<ul>
			<li>`_status_` - a HTTP status code, eg. 200 is OK, 404 Not found.
			<li>`_options_` - similar to those in the request, here describing the response data.
				This field can contain comma-separated `B`, `H` and `L=<i>bytes</i>`.
			<li>`_response_` - the response, as requested. If both headers and body are received,
				they will be separated by an empty line (i.e. `\r\n\r\n`). Response can be up to several
				kilobytes long, depending on the `L=` and `l=` options.
		</ul>

		<p>
			*Example:* `\e^H;GET;B;http://wtfismyip.com/text\a` - get the body of a web page
			(wtfismyip.com is a service that sends back your IP address).
			A response could be `\e^h;200;B,L=11;80.70.60.50\a`.
		</p>
	</div>
</div>
