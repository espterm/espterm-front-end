<?php

return [
	'menu.cfg_wifi' => 'Nastavení WiFi',
	'menu.cfg_network' => 'Nastavení sítě',
	'menu.cfg_term' => 'Nastavení terminalu',
	'menu.about' => 'About',
	'menu.help' => 'Nápověda',
	'menu.term' => 'Zpět k terminálu',
	'menu.cfg_system' => 'Nastavení systému',
	'menu.cfg_wifi_conn' => 'Připojování',
	'menu.settings' => 'Nastavení',

	// Terminal page

	'title.term' => 'Terminál', // page title of the terminal page

	'term_nav.fullscreen' => 'Celá obr.',
	'term_nav.config' => 'Nastavení',
	'term_nav.wifi' => 'WiFi',
	'term_nav.help' => 'Nápověda',
	'term_nav.about' => 'About',
	'term_nav.paste' => 'Vložit',
	'term_nav.upload' => 'Nahrát',
	'term_nav.keybd' => 'Klávesnice',
	'term_nav.paste_prompt' => 'Vložte text k~odeslání:',

	'term_conn.connecting' => 'Připojuji se',
	'term_conn.waiting_content' => 'Čekám na data',
	'term_conn.disconnected' => 'Odpojen',
	'term_conn.waiting_server' => 'Čekám na server',
	'term_conn.reconnecting' => 'Obnova spojení',

	// Terminal settings page

	'term.defaults' => 'Výchozí nastavení',
	'term.expert' => 'Pokročilé volby',
	'term.explain_initials' => '
		Tato nastavení jsou použita po spuštění a při resetu obrazovky
		(příkaz RIS, <code>\ec</code>). Tyto volby lze měnit za běhu 
		pomocí řídicích sekvencí.
		',
	'term.explain_expert' => '
		Interní parametry terminálu. Změnou časování lze dosáhnout kratší
		latence a~rychlejšího překreslování, hodnoty záleží na konkrétní 
		aplikaci. Timeout parseru je čas do automatického zrušení započaté 
		řídicí sekvence.',

	'term.example' => 'Náhled výchozích barev',

	'term.explain_scheme' => '
		Výchozí barvu textu a pozadí vyberete kliknutím na barvy v~paletě.
		Dále lze použít ANSI barvy 0-255 a hex ve formátu #FFFFFF.
		',

	'term.fgbg_presets' => 'Předvolby výchozích<br>barev textu a pozadí',
	'term.color_scheme' => 'Barevné schéma',
	'term.reset_screen' => 'Resetovat obrazovku a parser',
	'term.term_title' => 'Nadpis',
	'term.term_width' => 'Šířka',
	'term.term_height' => 'Výška',
	'term.buttons' => 'Text tlačítke',
	'term.theme' => 'Barevná paleta',
	'term.cursor_shape' => 'Styl kurzoru',
	'term.parser_tout_ms' => 'Timeout parseru',
	'term.display_tout_ms' => 'Prodleva překreslení',
	'term.display_cooldown_ms' => 'Min. čas překreslení',
	'term.allow_decopt_12' => 'Povolit \e?12h/l',
	'term.fn_alt_mode' => 'SS3 Fx klávesy',
	'term.show_config_links' => 'Menu pod obrazovkou',
	'term.show_buttons' => 'Zobrazit tlačítka',
	'term.loopback' => 'Loopback (<span style="text-decoration:overline">SRM</span>)',
	'term.crlf_mode' => 'Enter = CR+LF (LNM)',
	'term.want_all_fn' => 'Zachytávat F5, F11, F12',
	'term.button_msgs' => 'Reporty tlačítek<br>(dek. ASCII CSV)',
	'term.color_fg' => 'Výchozí text',
	'term.color_bg' => 'Výchozí pozadí',
	'term.color_fg_prev' => 'Barva textu',
	'term.color_bg_prev' => 'Barva pozadí',
	'term.colors_preview' => '',

	'cursor.block_blink' => 'Blok, blikající',
    'cursor.block_steady' => 'Blok, stálý',
    'cursor.underline_blink' => 'Podtržítko, blikající',
    'cursor.underline_steady' => 'Podtržítko, stálé',
    'cursor.bar_blink' => 'Svislice, blikající',
    'cursor.bar_steady' => 'Svislice, stálá',

	// Network config page

	'net.explain_sta' => '
		Odškrtněte "Použít dynamickou IP" pro nastavení statické IP adresy.',

	'net.explain_ap' => '
		Tato nastavení ovlivňují interní DHCP server v AP režimu (hotspot).',

	'net.ap_dhcp_time' => 'Doba zapůjčení adresy',
	'net.ap_dhcp_start' => 'Začátek IP poolu',
	'net.ap_dhcp_end' => 'Konec IP poolu',
	'net.ap_addr_ip' => 'Vlastní IP adresa',
	'net.ap_addr_mask' => 'Maska podsítě',

	'net.sta_dhcp_enable' => 'Použít dynamickou IP',
	'net.sta_addr_ip' => 'Statická IP modulu',
	'net.sta_addr_mask' => 'Maska podsítě',
	'net.sta_addr_gw' => 'Gateway',

	'net.ap' => 'DHCP server (AP)',
	'net.sta' => 'DHCP klient',
	'net.sta_mac' => 'MAC adresa klienta',
	'net.ap_mac' => 'MAC adresa AP',
	'net.details' => 'MAC adresy',

	// Wifi config page

	'wifi.ap' => 'Vlastní hotspot (AP)',
	'wifi.sta' => 'Připojení k~externí síti',

	'wifi.enable' => 'Zapnuto',
	'wifi.tpw' => 'Vysílací výkon',
	'wifi.ap_channel' => 'WiFi kanál',
	'wifi.ap_ssid' => 'Jméno hotspotu',
	'wifi.ap_password' => 'Přístupové heslo',
	'wifi.ap_hidden' => 'Skrýt síť',
	'wifi.sta_info' => 'Zvolená síť',

	'wifi.not_conn' => 'Nepřipojen.',
	'wifi.sta_none' => 'Žádná',
	'wifi.sta_active_pw' => '🔒 Heslo uloženo',
	'wifi.sta_active_nopw' => '🔓 Bez hesla',
	'wifi.connected_ip_is' => 'Připojen, IP: ',
	'wifi.sta_password' => 'Heslo:',

	'wifi.scanning' => 'Hledám sítě',
	'wifi.scan_now' => 'Klikněte pro vyhledání sítí!',
	'wifi.cant_scan_no_sta' => 'Klikněte pro zapnutí režimu klienta a vyhledání sítí!',
	'wifi.select_ssid' => 'Dostupné sítě:',
	'wifi.enter_passwd' => 'Zadejte heslo pro ":ssid:"',
	'wifi.sta_explain' => 'Vyberte síť a připojte se tlačítkem vpravo nahoře.',

	// Wifi connecting status page

	'wificonn.status' => 'Stav:',
	'wificonn.back_to_config' => 'Zpět k~nastavení WiFi',
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
	'enabled' => 'Enabled',
	'disabled' => 'Disabled',
	'yes' => 'Yes',
	'no' => 'No',
	'confirm' => 'OK',
	'form_errors' => 'Validation errors for:',
];
