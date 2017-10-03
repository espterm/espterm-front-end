<?php

return [
	'menu.cfg_wifi' => 'WiFi Settings',
	'menu.cfg_network' => 'Network Settings',
	'menu.cfg_term' => 'Terminal Settings',
	'menu.about' => 'About ESPTerm',
	'menu.help' => 'Quick Reference',
	'menu.term' => 'Back to Terminal',
	'menu.cfg_system' => 'System Settings',
	'menu.cfg_wifi_conn' => 'Connecting to Network',
	'menu.settings' => 'Settings',

	// Terminal page

	'title.term' => 'Terminal', // page title of the terminal page

	'term_nav.fullscreen' => 'Fullscreen',
	'term_nav.config' => 'Config',
	'term_nav.wifi' => 'WiFi',
	'term_nav.help' => 'Help',
	'term_nav.about' => 'About',
	'term_nav.paste' => 'Paste',
	'term_nav.upload' => 'Upload',
	'term_nav.keybd' => 'Keyboard',
	'term_nav.paste_prompt' => 'Paste text to send:',

	'term_conn.connecting' => 'Connecting',
	'term_conn.waiting_content' => 'Waiting for content',
	'term_conn.disconnected' => 'Disconnected',
	'term_conn.waiting_server' => 'Waiting for server',
	'term_conn.reconnecting' => 'Reconnecting',

	// Terminal settings page

	'term.defaults' => 'Initial Settings',
	'term.expert' => 'Expert Options',
	'term.explain_initials' => '
		Those are the initial settings used after ESPTerm powers on, 
		or when the screen reset command is received (<code>\ec</code>).
		They can be changed by the terminal application using escape sequences.
		',
	'term.explain_expert' => '
		Those are advanced config options that usually don\'t need to be changed.
		Edit them only if you know what you\'re doing.',

	'term.example' => 'Default colors preview',

	'term.explain_scheme' => '
		To select default text and background color, click on the
		preview palette. Alternatively, use numbers 0-15 for theme colors,
		16-255 for standard colors and hex (#FFFFFF) for True Color (24-bit).
		',

	'term.fgbg_presets' => 'Defaults Presets',
	'term.color_scheme' => 'Color Scheme',
	'term.reset_screen' => 'Reset screen & parser',
	'term.term_title' => 'Header Text',
	'term.term_width' => 'Width',
	'term.term_height' => 'Height',
	'term.buttons' => 'Button Labels',
	'term.theme' => 'Color Palette',
	'term.cursor_shape' => 'Cursor Style',
	'term.parser_tout_ms' => 'Parser Timeout',
	'term.display_tout_ms' => 'Redraw Delay',
	'term.display_cooldown_ms' => 'Redraw Cooldown',
	'term.allow_decopt_12' => 'Allow \e?12h/l',
	'term.fn_alt_mode' => 'SS3 Fn keys',
	'term.show_config_links' => 'Show nav links',
	'term.show_buttons' => 'Show buttons',
	'term.loopback' => 'Local Echo (<span style="text-decoration:overline">SRM</span>)',
	'term.crlf_mode' => 'Enter = CR+LF (LNM)',
	'term.want_all_fn' => 'Capture F5, F11, F12',
	'term.button_msgs' => 'Button codes<br>(ASCII, dec, CSV)',
	'term.color_fg' => 'Default Fg.',
	'term.color_bg' => 'Default Bg.',
	'term.color_fg_prev' => 'Foreground',
	'term.color_bg_prev' => 'Background',
	'term.colors_preview' => '',
	'term.debugbar' => 'Debug internal state',
	'term.ascii_debug' => 'Display control codes',

	'cursor.block_blink' => 'Block, blinking',
    'cursor.block_steady' => 'Block, steady',
    'cursor.underline_blink' => 'Underline, blinking',
    'cursor.underline_steady' => 'Underline, steady',
    'cursor.bar_blink' => 'I-bar, blinking',
    'cursor.bar_steady' => 'I-bar, steady',

	// Text upload dialog

	'upload.title' => 'Text Upload',
	'upload.prompt' => 'Load a text file:',
	'upload.endings' => 'Line endings:',
	'upload.endings.cr' => 'CR (Enter key)',
	'upload.endings.crlf' => 'CR LF (Windows)',
	'upload.endings.lf' => 'LF (Linux)',
	'upload.chunk_delay' => 'Chunk delay (ms):',
	'upload.chunk_size' => 'Chunk size (0=line):',
	'upload.progress' => 'Upload:',

	// Network config page

	'net.explain_sta' => '
		Switch off Dynamic IP to configure the static IP address.',

	'net.explain_ap' => '
		Those settings affect the built-in DHCP server in AP mode.',

	'net.ap_dhcp_time' => 'Lease time',
	'net.ap_dhcp_start' => 'Pool start IP',
	'net.ap_dhcp_end' => 'Pool end IP',
	'net.ap_addr_ip' => 'Own IP address',
	'net.ap_addr_mask' => 'Subnet mask',

	'net.sta_dhcp_enable' => 'Use dynamic IP',
	'net.sta_addr_ip' => 'ESPTerm static IP',
	'net.sta_addr_mask' => 'Subnet mask',
	'net.sta_addr_gw' => 'Gateway IP',

	'net.ap' => 'DHCP Server (AP)',
	'net.sta' => 'DHCP Client (Station)',
	'net.sta_mac' => 'Station MAC',
	'net.ap_mac' => 'AP MAC',
	'net.details' => 'MAC addresses',

	// Wifi config page

	'wifi.ap' => 'Built-in Access Point',
	'wifi.sta' => 'Join Existing Network',

	'wifi.enable' => 'Enabled',
	'wifi.tpw' => 'Transmit power',
	'wifi.ap_channel' => 'Channel',
	'wifi.ap_ssid' => 'AP SSID',
	'wifi.ap_password' => 'Password',
	'wifi.ap_hidden' => 'Hide SSID',
	'wifi.sta_info' => 'Selected',

	'wifi.not_conn' => 'Not connected.',
	'wifi.sta_none' => 'None',
	'wifi.sta_active_pw' => '🔒 Password saved',
	'wifi.sta_active_nopw' => '🔓 Open access',
	'wifi.connected_ip_is' => 'Connected, IP is ',
	'wifi.sta_password' => 'Password:',

	'wifi.scanning' => 'Scanning',
	'wifi.scan_now' => 'Click here to start scanning!',
	'wifi.cant_scan_no_sta' => 'Click here to enable client mode and start scanning!',
	'wifi.select_ssid' => 'Available networks:',
	'wifi.enter_passwd' => 'Enter password for ":ssid:"',
	'wifi.sta_explain' => 'After selecting a network, press Apply to connect.',

	// Wifi connecting status page

	'wificonn.status' => 'Status:',
	'wificonn.back_to_config' => 'Back to WiFi config',
	'wificonn.telemetry_lost' => 'Telemetry lost; something went wrong, or your device disconnected.',
	'wificonn.explain_android_sucks' => '
		If you\'re configuring ESPTerm via a smartphone, or were connected 
		from another external network, your device may lose connection and 
		this progress indicator won\'t work. Please wait a while (~ 15 seconds), 
		then check if the connection succeeded.',

	'wificonn.explain_reset' => '
		To force enable the built-in AP, hold the BOOT button until the blue LED 
		starts flashing. Hold the button longer (until the LED flashes rapidly) 
		for a "factory reset".',

	'wificonn.disabled' =>"Station mode is disabled.",
	'wificonn.idle' =>"Idle, not connected and has no IP.",
	'wificonn.success' => "Connected! Received IP ",
	'wificonn.working' => "Connecting to selected AP",
	'wificonn.fail' => "Connection failed, check settings & try again. Cause: ",

	// Access restrictions form

	'pwlock.title' => 'Access Restrictions',
	'pwlock.explain' => '
		Some parts, or all of the web interface can be protected by a password prompt.
		Leave the new password fields empty if you do not wish to change it.<br>
		The default password is "%def_access_pw%".
	',
	'pwlock.region' => 'Protected pages',
	'pwlock.region.none' => 'None, all open',
	'pwlock.region.settings_noterm' => 'WiFi, Net & System settings',
	'pwlock.region.settings' => 'All settings pages',
	'pwlock.region.menus' => 'This entire menu section',
	'pwlock.region.all' => 'Everything, even terminal',
	'pwlock.new_access_pw' => 'New password',
	'pwlock.new_access_pw2' => 'Repeat',
	'pwlock.admin_pw' => 'Admin password',
	'pwlock.access_name' => 'Username',

	// Setting admin password

	'adminpw.title' => 'Change Admin Password',
	'adminpw.explain' =>
		'
		The "admin password" is used to manipulate the stored default settings 
		and to change access restrictions. This password is not saved as part 
		of the main config, i.e. using save / restore does not affect this 
		password. When the admin password is forgotten, the easiest way to 
		re-gain access is to wipe and re-flash the chip.<br>
		The default admin password is "%def_admin_pw%".
		',
	'adminpw.new_admin_pw' => 'New admin password',
	'adminpw.new_admin_pw2' => 'Repeat',
	'adminpw.old_admin_pw' => 'Old admin password',

	// Persist form

	'persist.title' => 'Save & Restore',
	'persist.explain' => '
		ESPTerm saves all settings in Flash. The active settings can be copied to
		the "defaults area" and restored later using the blue button below.
		',
	'persist.confirm_restore' => 'Restore all settings to their default values?',
	'persist.confirm_restore_hard' =>
		'Restore to firmware default settings? This will reset ' .
		'all active settings and switch to AP mode with the default SSID.',
	'persist.confirm_store_defaults' =>
		'Enter admin password to confirm you want to overwrite the default settings.',
	'persist.password' => 'Admin password:',
	'persist.restore_defaults' => 'Reset to saved defaults',
	'persist.write_defaults' => 'Save active settings as defaults',
	'persist.restore_hard' => 'Reset active settings to factory defaults',
	'persist.restore_hard_explain' =>
		'(This clears the WiFi config! Does not affect saved defaults or admin password.)',

	// UART settings form

	'uart.title' => 'Serial Port Parameters',
	'uart.explain' => '
		This form controls the communication UART. The debug UART is fixed
		at 115.200 baud, one stop-bit and no parity.
		',
	'uart.baud' => 'Baud rate',
	'uart.parity' => 'Parity',
	'uart.parity.none' => 'None',
	'uart.parity.odd' => 'Odd',
	'uart.parity.even' => 'Even',
	'uart.stop_bits' => 'Stop-bits',
	'uart.stop_bits.one' => 'One',
	'uart.stop_bits.one_and_half' => 'One and half',
	'uart.stop_bits.two' => 'Two',

	// HW tuning form

	'hwtuning.title' => 'Hardware Tuning',
	'hwtuning.explain' => '
		ESP8266 can be overclocked from 80&nbsp;MHz to 160&nbsp;MHz. This will make 
		it more responsive and allow faster screen updates at the expense of slightly 
		higher power consumption. This can also make it more susceptible to interference.
		Use with care.
		',
	'hwtuning.overclock' => 'Overclock to 160MHz',

	// Generic button / dialog labels

	'apply' => 'Apply!',
	'start' => 'Start',
	'cancel' => 'Cancel',
	'enabled' => 'Enabled',
	'disabled' => 'Disabled',
	'yes' => 'Yes',
	'no' => 'No',
	'confirm' => 'OK',
	'copy' => 'Copy',
	'form_errors' => 'Validation errors for:',
];
