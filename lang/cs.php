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
//	'term.debugbar' => 'Ladění ',
//	'term.ascii_debug' => 'Použít debug parser',

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

	'wifi.ap' => 'WiFi hotspot',
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
	'wifi.sta_active_pw' => '🔒 Uložené heslo',
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
	'wificonn.telemetry_lost' => 'Spojení bylo přerušeno; připojování selhalo, nebo jste byli odpojeni od sítě.',
	'wificonn.explain_android_sucks' => '
		Pokud ESPTerm konfigurujete pomocí mobilu nebo z~externí sítě, může se stát
		že některé ze zařízení změní síť a~ukazatel průběhu přestane fungovat. 
		Počkejte ~15s a pak zkontrolujte, zda se připojení zdařilo.
		',

	'wificonn.explain_reset' => '
		Interní hotspot lze kdykoliv vynutit podržením tlačítka BOOT, až modrá LED začne blikat.
		Podržíte-li tlačítko déle (LED začne blikat rychleji), dojde k~obnovení do výchozích anstavení.',

	'wificonn.disabled' => "Režim klienta není povolen.",
	'wificonn.idle' => "Žádná IP adresa, připojování neprobíhá.",
	'wificonn.success' => "Připijen! IP adresa je ",
	'wificonn.working' => "Připojuji k zvolené síti",
	'wificonn.fail' => "Připojení selhalo, zkontrolujte nastavení a~pokus opakujte. Důvod: ",

	// Access restrictions form

	'pwlock.title' => 'Omezení přístupu',
	'pwlock.explain' => '
		Části webového rozhraní lze chránit heslem. Nemáte-li v úmyslu heslo měnit, 
		do jeho políčka nic nevyplňujte.<br>
		Výchozí přístupové heslo je "%def_access_pw%".
	',
	'pwlock.region' => 'Chránit heslem',
	'pwlock.region.none' => 'Nic, vše volně přístupné',
	'pwlock.region.settings_noterm' => 'Nastavení, mimo terminál',
	'pwlock.region.settings' => 'Všechna nastavení',
	'pwlock.region.menus' => 'Celá admin. sekce',
	'pwlock.region.all' => 'Vše, včetně terminálu',
	'pwlock.new_access_pw' => 'Nové přístupové heslo',
	'pwlock.new_access_pw2' => 'Zopakujte nové heslo',
	'pwlock.admin_pw' => 'Systémové heslo',
	'pwlock.access_name' => 'Uživatelské jméno',

	// Setting admin password

	'adminpw.title' => 'Změna systémového hesla',
	'adminpw.explain' =>
		'
		Systémové heslo slouží k úpravám uložených výchozích nastavení
		a ke změně přístupových oprávnění.
		Toto heslo je uloženo mimo ostatní data, obnovení do výchozách nastavení
		na něj nemá vliv.
		Toto heslo nelze jednoduše obnovit, v případě zapomenutí vymažte flash paměť a obnovte firmware.<br>
		Vychozí systémové heslo je "%def_admin_pw%".
		',
	'adminpw.new_admin_pw' => 'Nové systémové heslo',
	'adminpw.new_admin_pw2' => 'Zopakujte nové heslo',
	'adminpw.old_admin_pw' => 'Původní systémové heslo',

	// Persist form

	'persist.title' => 'Záloha a~obnovení konfigurace',
	'persist.explain' => '
		Všechna nastavení jsou ukládána do flash paměti. V~paměti jsou
		vyhrazené dva oddíly, aktivní nastavení a záloha. Zálohu lze přepsat
		za použití systémového hesla, původní nastavení z ní pak můžete kdykoliv obnovit.
		Pro obnovení ze zálohy stačí podržet tlačítko BOOT, až modrá LED začne rychle blikat.
		',
	'persist.confirm_restore' => 'Chcete obnovit všechna nastavení?',
	'persist.confirm_restore_hard' =>
		'Opravdu chcete načíst tovární nastavení? Všechna nastavení kromě zálohy a systémového hesla
		 budou přepsána, včetně nastavení WiFi!',
	'persist.confirm_store_defaults' =>
		'Zadejte systémové heslo pro přepsání zálohy aktuálními parametry.',
	'persist.password' => 'Systémové heslo:',
	'persist.restore_defaults' => 'Obnovit ze zálohy',
	'persist.write_defaults' => 'Zálohovat aktuální nastavení',
	'persist.restore_hard' => 'Načíst tovární nastavení',
	'persist.restore_hard_explain' =>
		'(Tímto vymažete nastavení WiFi! Záloha a systémové heslo zůstanou beze změny.)',

	// UART settings form

	'uart.title' => 'Sériový port',
	'uart.explain' => '
		Tímto formulářem můžete upravit nastavení komunikačního UARTu. 
		Ladicí výpisy jsou na pinu P2 s~pevnými parametry: 115200 baud, 1 stop bit, žádná parita. 
		',
	'uart.baud' => 'Rychlost',
	'uart.parity' => 'Parita',
	'uart.parity.none' => 'Źádná',
	'uart.parity.odd' => 'Lichá',
	'uart.parity.even' => 'Sudá',
	'uart.stop_bits' => 'Stop-bity',
	'uart.stop_bits.one' => '1',
	'uart.stop_bits.one_and_half' => '1.5',
	'uart.stop_bits.two' => '2',

	// HW tuning form

	'hwtuning.title' => 'Tuning hardwaru',
	'hwtuning.explain' => '
		ESP8266 lze přetaktovat z~80~MHz na 160~MHz. Vyšší rychlost umožní rychlejší překreslování
		obrazovky a stránky se budou načítat rychleji. Nevýhodou je vyšší spotřeba a citlivost k~rušení.
		',
	'hwtuning.overclock' => 'Přetaktovat na 160~MHz',

	// Generic button / dialog labels

	'apply' => 'Uložit!',
	'enabled' => 'Zapnuto',
	'disabled' => 'Vypnuto',
	'yes' => 'Ano',
	'no' => 'Ne',
	'confirm' => 'OK',
	'form_errors' => 'Neplatné hodnoty:',
];
