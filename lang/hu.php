<?php

return [
	'menu.cfg_wifi' => 'WiFi Beállítások',
	'menu.cfg_network' => 'Hálózati beállítások',
	'menu.cfg_term' => 'Terminál beállítások',
	'menu.about' => 'Az ESPTerm-ről',
	'menu.help' => 'Gyors referencia',
	'menu.term' => 'Vissza a terminálba',
	'menu.cfg_system' => 'Rendszer beállítások',
	'menu.cfg_wifi_conn' => 'Csatlakozás a hálózathoz',
	'menu.settings' => 'Beállítások',

	// Terminal page

	'title.term' => 'Terminál', // page title of the terminal page

	'term_nav.fullscreen' => 'Teljesképernyő',
	'term_nav.config' => 'Beállítás',
	'term_nav.wifi' => 'WiFi',
	'term_nav.help' => 'Segítség',
	'term_nav.about' => 'Info',
	'term_nav.paste' => 'Beillesztés',
	'term_nav.upload' => 'Feltöltés',
	'term_nav.keybd' => 'Billentyűzet',
	'term_nav.paste_prompt' => 'Szöveg beillesztése és küldése:',

	'term_conn.connecting' => 'Csatlakozás',
	'term_conn.waiting_content' => 'Várakozás a csatlakozásra',
	'term_conn.disconnected' => 'Kapcsolat bontva',
	'term_conn.waiting_server' => 'Várakozás a kiszolgálóra',
	'term_conn.reconnecting' => 'Újracsatlakozás',

	// Terminal settings page

	'term.defaults' => 'Alap beállítások',
	'term.expert' => 'Haladó beállítások',
	'term.explain_initials' => '
		Ezek az alap beállítások amik az ESPTerm bekapcsolása után, 
		vagy amikor képernyő reset parancsa érkezikd (<code>\ec</code>).
		Ezek megváltoztathatóak egy terminál alkalmzás és escape szekveciák segítségével.
		',
	'term.explain_expert' => '
		Ezek haladó beállítási opciók amiket általában nem kell megváltoztatni.
		Csak akkor változtass rajta ha tudod mit csinálsz!',

	'term.example' => 'Alapértelmezet színek előnézete',

	'term.explain_scheme' => '
		Az alapértelmezett szöveg és háttér szín kiválasztásához kattints a
		paletta előnézet gombra. Alternatíva: használd a 0-15 számokat a téma színekhez,
		16-255 számokat a normál színekhez és hexa (#FFFFFF) a True Color (24-bit) színekhez.
		',

	'term.fgbg_presets' => 'Alapértelmezett beállítások',
	'term.color_scheme' => 'Szín séma',
	'term.reset_screen' => 'A képernyő olvasó alapállapotba állítása',
	'term.term_title' => 'Fejléc szöveg',
	'term.term_width' => 'Szélesség',
	'term.term_height' => 'Magasség',
	'term.buttons' => 'Gomb cimkék',
	'term.theme' => 'Szín paletta',
	'term.cursor_shape' => 'Kurzor stílus',
	'term.parser_tout_ms' => 'Olvasó időtúllépés',
	'term.display_tout_ms' => 'Újrarajzolás késleltetése',
	'term.display_cooldown_ms' => 'Újrarajzolás cooldown',
	'term.allow_decopt_12' => '\e?12h/l engedélyezés',
	'term.fn_alt_mode' => 'SS3 Fn gombok',
	'term.show_config_links' => 'Navigációs linkek mutatása',
	'term.show_buttons' => 'Gombok mutatása',
	'term.loopback' => 'Helyi visszajelzés (<span style="text-decoration:overline">SRM</span>)',
	'term.crlf_mode' => 'Enter = CR+LF (LNM)',
	'term.want_all_fn' => 'F5, F11, F12 elfogása',
	'term.button_msgs' => 'Gomb kódok<br>(ASCII, dec, CSV)',
	'term.color_fg' => 'Alap előtér.',
	'term.color_bg' => 'Alap háttér',
	'term.color_fg_prev' => 'Előtér',
	'term.color_bg_prev' => 'Háttér',
	'term.colors_preview' => '',
	'term.debugbar' => 'Belső állapot hibakeresés',
	'term.ascii_debug' => 'Kontroll kódok mutatása',
	'term.backdrop' => 'Háttérkép URL.je',
	'term.button_count' => 'Gomb szám',
	'term.button_colors' => 'Gomb színek',
	'term.font_stack' => 'Betű típus',
	'term.font_size' => 'Betű méret',

	'cursor.block_blink' => 'Blokk, villog',
	'cursor.block_steady' => 'Blokk, fix',
	'cursor.underline_blink' => 'Aláhúzás, villog',
	'cursor.underline_steady' => 'Aláhúzás, fix',
	'cursor.bar_blink' => 'I, villog',
	'cursor.bar_steady' => 'I, fix',

	// Text upload dialog

	'upload.title' => 'Szöveg feltöltése',
	'upload.prompt' => 'Szöveg fájl betöltése:',
	'upload.endings' => 'Sor vége:',
	'upload.endings.cr' => 'CR (Enter gomb)',
	'upload.endings.crlf' => 'CR LF (Windows)',
	'upload.endings.lf' => 'LF (Linux)',
	'upload.chunk_delay' => 'Chunk késleltetés (ms):',
	'upload.chunk_size' => 'Chunk méret (0=line):',
	'upload.progress' => 'Feltöltés:',

	// Network config page

	'net.explain_sta' => '
		Kapcsold ki a dinamikus IP címet a statikus cím beállításához.',

	'net.explain_ap' => '
		Ezek a beállítások a beépített DHCP szervet és az AP módot befolyásolják.',

	'net.ap_dhcp_time' => 'Lízing idő',
	'net.ap_dhcp_start' => 'Kezdő IP cím',
	'net.ap_dhcp_end' => 'Záró IP cím',
	'net.ap_addr_ip' => 'Saját IP cím',
	'net.ap_addr_mask' => 'Hálózati maszk',

	'net.sta_dhcp_enable' => 'Dinamikus IP cím használata',
	'net.sta_addr_ip' => 'ESPTerm statikus IP címe',
	'net.sta_addr_mask' => 'Hálózati maszk',
	'net.sta_addr_gw' => 'Útválasztó IP címe',

	'net.ap' => 'DHCP Szerver (AP)',
	'net.sta' => 'DHCP Kliens (Station)',
	'net.sta_mac' => 'Állomás MAC címe',
	'net.ap_mac' => 'AP MAC címe',
	'net.details' => 'MAC címek',

	// Wifi config page

	'wifi.ap' => 'Beépített Access Point',
	'wifi.sta' => 'Kapcsolódás létező hálózathoz',

	'wifi.enable' => 'Engedélyezve',
	'wifi.tpw' => 'Adás teljesítmény',
	'wifi.ap_channel' => 'Csatorna',
	'wifi.ap_ssid' => 'AP SSID',
	'wifi.ap_password' => 'Jelszó',
	'wifi.ap_hidden' => 'SSID rejtése',
	'wifi.sta_info' => 'Kiválasztott',

	'wifi.not_conn' => 'Nincs csatlkoztatva.',
	'wifi.sta_none' => 'Egyiksem',
	'wifi.sta_active_pw' => '🔒 Jelszó elmentve',
	'wifi.sta_active_nopw' => '🔓 Szabad hozzáférés',
	'wifi.connected_ip_is' => 'Csatlakozva, az IP cím ',
	'wifi.sta_password' => 'Jelszó:',

	'wifi.scanning' => 'Keresés',
	'wifi.scan_now' => 'Kattints a keresés indításához!',
	'wifi.cant_scan_no_sta' => 'Kattints a kliens mód engedélyezéséhez és a keresés indításához!',
	'wifi.select_ssid' => 'Elérhető hálózatok:',
	'wifi.enter_passwd' => 'Jelszó a(z) ":ssid:" hálózathoz',
	'wifi.sta_explain' => 'A hálózat kiválasztása után nyomdj meg az Alkamaz gombot a csatlakozáshoz.',

	// Wifi connecting status page

	'wificonn.status' => 'Státusz:',
	'wificonn.back_to_config' => 'Vissza a  WiFi beállításhoz',
	'wificonn.telemetry_lost' => 'Telemetria megszakadt; valami hiba történt, vagy az eszközöd elvesztette a kapcsolatot.',
	'wificonn.explain_android_sucks' => '
		Ha okostelefonon kapcsolódsz az ESPTerm-hez, vagy amikor csatlakozol 
		egy másik hálózatról, az eszközöd elveszítheti a kapcsolatot és 
		ez az indikátor nem fog működni. Kérlek várj egy keveset (~ 15 másodpercet), 
		és ellenőrizd, hogy a kapcsolat helyrejött-e.',

	'wificonn.explain_reset' => '
		Az beépített AP engedélyezéséhez tarts lenyomva a BOOT gombot amíg a kék led 
		villogni nem kezd. Tartsd addig lenyomva amíg a led el nem kezd gyorsan villogni 
		a gyári alapállapot visszaállításához".',

	'wificonn.disabled' =>"Station mode letiltva.",
	'wificonn.idle' =>"Alapállapot, nincs csatlakozva és nincs IP címe.",
	'wificonn.success' => "Csatlakozva! Kaptam IP címet",
	'wificonn.working' => "Csatlakozás a beállított AP-hez",
	'wificonn.fail' => "Csatlakozás nem sikerült, ellenőrizd a beállítások és próbáld újra. A hibaok: ",

	// Access restrictions form

	'pwlock.title' => 'Hozzáférés korlátozása',
	'pwlock.explain' => '
		A web interfész néhany része vagy a teljes interfész jelszavas védelemmel látható el.
		Hagyd a jelszó mezőt üresen ha nem akarod megváltoztatni.<br>
		Az alapértelmezett jelszó "%def_access_pw%".
	',
	'pwlock.region' => 'Védett oldalak',
	'pwlock.region.none' => 'Egyiksem, minden hozzáférhető',
	'pwlock.region.settings_noterm' => 'WiFi, Hálózat és Rendszer beállítások',
	'pwlock.region.settings' => 'Minden beállítás oldal',
	'pwlock.region.menus' => 'Ez a teljes menű rész',
	'pwlock.region.all' => 'Minden, még a terminál is',
	'pwlock.new_access_pw' => 'Új jelszó',
	'pwlock.new_access_pw2' => 'Jelszó ismét',
	'pwlock.admin_pw' => 'Admin jelszó',
	'pwlock.access_name' => 'Felhasználó név',

	// Setting admin password

	'adminpw.title' => 'Admin jelszó megváltoztatása',
	'adminpw.explain' =>
		'
		Az "admin jelszo" a tárolt alap beállítások módosításához és a hozzáférések 
		változtatásához kell. Ez a jelszó nincs a többi beállítással egy helyre mentve,
		tehát a mentés és visszaállítás műveletek nem befolyásolják.
		Ha az admin jelszó elveszik akkor a legegyszerűbb módja a hozzáférés
		visszaszerzésére a chip újraflashselésere.<br>
		Az alap jelszó: "%def_admin_pw%".
		',
	'adminpw.new_admin_pw' => 'Új admin jelszó',
	'adminpw.new_admin_pw2' => 'Jelszó ismét',
	'adminpw.old_admin_pw' => 'Régi admin jelszó',

	// Persist form

	'persist.title' => 'Mentés & Visszaállítás',
	'persist.explain' => '
		ESPTerm az összes beállítást Flash-be menti. Az aktív beállítások at lehet másolni
		a "alapértelmezett" területre és az később a lenti kék gombbal visszaállítható.
		',
	'persist.confirm_restore' => 'Minden beállítást visszaállítasz az "alap" értékre?',
	'persist.confirm_restore_hard' =>
		'Visszaállítod a rendszer alap beállításait? Ez minden aktív ' .
		'beállítást törölni fog és AP módban az alap SSID-vel for újraindulni.',
	'persist.confirm_store_defaults' =>
		'Add meg az admin jelszót az alapállapotba állítás megerősítéshez.',
	'persist.password' => 'Admin jelszó:',
	'persist.restore_defaults' => 'Mentett beállítások visszaállítása',
	'persist.write_defaults' => 'Aktív beállítások mentése alapértelmezetnek',
	'persist.restore_hard' => 'Gyári alapbeállítások betöltése',
	'persist.restore_hard_explain' =>
		'(Ez törli a Wifi beállításokat, de nincs hatása az admin jelszóra.)',

	'backup.title' => 'Configurációs fájl biztonsági másolat készítés',
	'backup.explain' => 'Minden beállítás menthető és visszaállítható az admin jelszó kivételévelAll config except the admin password can be backed up and restored using  egy .INI fájllal.',
	'backup.export' => 'Fáljbe exportálás',
	'backup.import' => 'Importálás!',


	// UART settings form

	'uart.title' => 'Soros port paraméterek',
	'uart.explain' => '
		Ez a beállítás szabályozza a kommunikációs UART-ot. A hibakereső UART fix  
        	115.200 baud-val, egy stop-bittel és paritás bit nélkül működik.
		',
	'uart.baud' => 'Baud rate',
	'uart.parity' => 'Parity',
	'uart.parity.none' => 'Egyiksem',
	'uart.parity.odd' => 'Páratlan',
	'uart.parity.even' => 'Páros',
	'uart.stop_bits' => 'Stop-bit',
	'uart.stop_bits.one' => 'Egy',
	'uart.stop_bits.one_and_half' => 'Másfél',
	'uart.stop_bits.two' => 'Kettő',

	// HW tuning form

	'hwtuning.title' => 'Hardware Tuning',
	'hwtuning.explain' => '
		ESP8266-t órajelét lehetséges 80&nbsp;MHz-ről 160&nbsp;MHz-re emelni. Ettől  
		jobb válaszidők és gyakoribb képernyő frissítések várhatóak, viszont megnövekszik 
		az energia felhasználás. Az interferencia esélye is megnő.
		Ovatosan használd!.
		',
	'hwtuning.overclock' => 'Órajel emelése 160MHz-re',

	// Generic button / dialog labels

	'apply' => 'Alkalmaz',
	'start' => 'Start',
	'cancel' => 'Mégse',
	'enabled' => 'Engedélyezve',
	'disabled' => 'Letiltva',
	'yes' => 'Igen',
	'no' => 'Nem',
	'confirm' => 'OK',
	'copy' => 'Másolás',
	'form_errors' => 'Validációs hiba:',
];
