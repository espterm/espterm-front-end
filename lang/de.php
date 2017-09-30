<?php

return [
  'appname' => 'ESPTerm',
  'appname_demo' => 'ESPTerm<sup> DEMO</sup>',

  'menu.cfg_wifi' => 'WLAN-Einstellungen',
  'menu.cfg_network' => 'Netzwerkeinstellungen',
  'menu.cfg_term' => 'Terminaleinstellungen',
  'menu.about' => 'Über ESPTerm',
  'menu.help' => 'Referenz',
  'menu.term' => 'Zurück zum Terminal',
  'menu.cfg_system' => 'Systemeinstellungen',
  'menu.cfg_wifi_conn' => 'Verbinden mit dem Netzwerk',
  'menu.settings' => 'Einstellungen',

  // not used - api etc. Added to suppress warnings
  'menu.term_set' => '',
  'menu.wifi_connstatus' => '',
  'menu.wifi_set' => '',
  'menu.wifi_scan' => '',
  'menu.network_set' => '',
  'menu.system_set' => '',
  'menu.write_defaults' => '',
  'menu.restore_defaults' => '',
  'menu.restore_hard' => '',
  'menu.reset_screen' => '',
  'menu.index' => '',

  // Terminal page

  'title.term' => 'Terminal', // page title of the terminal page

  'term_nav.fullscreen' => 'Vollbild',
  'term_nav.config' => 'Konfiguration',
  'term_nav.wifi' => 'WLAN',
  'term_nav.help' => 'Hilfe',
  'term_nav.about' => 'Info',
  'term_nav.paste' => 'Einfügen',
  'term_nav.upload' => 'Hochladen',
  'term_nav.keybd' => 'Tastatur',
  'term_nav.paste_prompt' => 'Text einfügen zum Versenden:',

  'term_conn.connecting' => 'Verbinden',
  'term_conn.waiting_content' => 'Warten auf Inhalt',
  'term_conn.disconnected' => 'Nicht verbunden',
  'term_conn.waiting_server' => 'Warten auf Server',
  'term_conn.reconnecting' => 'Verbinden',

  // Terminal settings page

  'term.defaults' => 'Anfangseinstellungen',
  'term.expert' => 'Expertenoptionen',
  'term.explain_initials' => '
    Dies sind die Anfangseinstellungen, die benutzt werden, nachdem ESPTerm startet, oder wenn der Bildschirm mit dem <code>\ec</code>-Kommando zurückgesetzt wird. Sie können durch Escape-Sequenzen verändert werden.
    ',
  'term.explain_expert' => '
    Dies sind erweiterte Konfigurationsoptionen, die meistens nicht verändert werden müssen. Bearbeite sie nur, wenn du weißt, was du tust.',

  'term.example' => 'Standardfarbenvorschau',

  'term.explain_scheme' => '
    Um die Standardtextfarbe und Standardhintergrundfarbe auszuwählen, klicke auf die Vorschaupalette, oder benutze die Zahlen 0-15 für die Themafarben, 16-255 für Standardfarben, oder Hexadezimal (#FFFFFF) für True Color (24-bit).
    ',

  'term.fgbg_presets' => 'Standardvoreinstellungen',
  'term.color_scheme' => 'Farbschema',
  'term.reset_screen' => 'Bildschirm & Parser zurücksetzen',
  'term.term_title' => 'Titeltext',
  'term.term_width' => 'Breite',
  'term.term_height' => 'Höhe',
  'term.buttons' => 'Tastentext',
  'term.theme' => 'Farbthema',
  'term.cursor_shape' => 'Cursorstil',
  'term.parser_tout_ms' => 'Parser-Auszeit',
  'term.display_tout_ms' => 'Zeichenverzögerung',
  'term.display_cooldown_ms' => 'Zeichenabkühlzeit',
  'term.allow_decopt_12' => '\e?12h/l erlauben',
  'term.fn_alt_mode' => 'SS3 Fn-Tasten',
  'term.show_config_links' => 'Navigationslinks anzeigen',
  'term.show_buttons' => 'Tasten anzeigen',
  'term.loopback' => 'Lokales Echo (<span style="text-decoration:overline">SRM</span>)',
  'term.crlf_mode' => 'Enter = CR+LF (LNM)',
  'term.want_all_fn' => 'F5, F11, F12 erfassen',
  'term.button_msgs' => 'Tastencodes<br>(ASCII, dec, CSV)',
  'term.color_fg' => 'Standardvordergr.',
  'term.color_bg' => 'Standardhintergr.',
  'term.color_fg_prev' => 'Vordergrund',
  'term.color_bg_prev' => 'Hintergrund',
  'term.colors_preview' => '',

  'cursor.block_blink' => 'Block, blinkend',
    'cursor.block_steady' => 'Block, ruhig',
    'cursor.underline_blink' => 'Unterstrich, blinkend',
    'cursor.underline_steady' => 'Unterstrich, ruhig',
    'cursor.bar_blink' => 'Balken, blinkend',
    'cursor.bar_steady' => 'Balken, ruhig',

  // Network config page

  'net.explain_sta' => '
    Schalte Dynamische IP aus um die statische IP-Addresse zu konfigurieren.',

  'net.explain_ap' => '
    Diese Einstellungen beeinflussen den eingebauten DHCP-Server im AP-Modus.',

  'net.ap_dhcp_time' => 'Leasezeit',
  'net.ap_dhcp_start' => 'Pool Start-IP',
  'net.ap_dhcp_end' => 'Pool End-IP',
  'net.ap_addr_ip' => 'Eigene IP-Addresse',
  'net.ap_addr_mask' => 'Subnet-Maske',

  'net.sta_dhcp_enable' => 'Dynamische IP verwenden',
  'net.sta_addr_ip' => 'ESPTerm statische IP',
  'net.sta_addr_mask' => 'Subnet-Mask',
  'net.sta_addr_gw' => 'Gateway-IP',

  'net.ap' => 'DHCP Server (AP)',
  'net.sta' => 'DHCP Client (Station)',
  'net.sta_mac' => 'Station MAC',
  'net.ap_mac' => 'AP MAC',
  'net.details' => 'MAC-Addressen',

  // Wifi config page

  'wifi.ap' => 'Eingebauter Access Point',
  'wifi.sta' => 'Bestehendes Netzwerk beitreten',

  'wifi.enable' => 'Aktiviert',
  'wifi.tpw' => 'Sendeleistung',
  'wifi.ap_channel' => 'Kanal',
  'wifi.ap_ssid' => 'AP SSID',
  'wifi.ap_password' => 'Passwort',
  'wifi.ap_hidden' => 'SSID verbergen',
  'wifi.sta_info' => 'Ausgewählt',

  'wifi.not_conn' => 'Nicht verbunden.',
  'wifi.sta_none' => 'Keine',
  'wifi.sta_active_pw' => '🔒 Passwort gespeichert',
  'wifi.sta_active_nopw' => '🔓 Offen',
  'wifi.connected_ip_is' => 'Verbunden, IP ist ',
  'wifi.sta_password' => 'Passwort:',

  'wifi.scanning' => 'Scannen',
  'wifi.scan_now' => 'Klicke hier um zu scannen!',
  'wifi.cant_scan_no_sta' => 'Klicke hier um Client-Modus zu aktivieren und zu scannen!',
  'wifi.select_ssid' => 'Verfügbare Netzwerke:',
  'wifi.enter_passwd' => 'Passwort für ":ssid:"',
  'wifi.sta_explain' => 'Nach dem Auswählen eines Netzwerks, drücke Bestätigen drücken, um dich zu verbinden.',

  // Wifi connecting status page

  'wificonn.status' => 'Status:',
  'wificonn.back_to_config' => 'Zurück zur WLAN-Konfiguration',
  'wificonn.telemetry_lost' => 'Telemetrie verloren; etwas lief schief, oder dein Gerät wurde getrennt.',
  'wificonn.explain_android_sucks' => '
    Wenn du gerade ESPTerm mit einem Handy oder über ein anderes externes Netzwerk konfigurierst, kann dein Gerät die Verbindung verlieren und diese Fortschrittsanzeige wird nicht funktionieren. Bitte warte eine Weile (etwa 15 Sekunden) und prüfe dann, ob die Verbindung gelangen ist.',

  'wificonn.explain_reset' => '
    Um den eingebauten AP zur Aktivierung zu zwingen, halte den BOOT-Knopf gedrückt bis die blaue LED beginnt, zu blinken. Halte ihn länger gedrückt (bis die LED schnell blinkt) um eine "Werksrückstellung" zu vollziehen.',

  'wificonn.disabled' => "Stationsmodus ist deaktiviert.",
  'wificonn.idle' => "Nicht verbunden und ohne IP.",
  'wificonn.success' => "Verbunden! Empfangene IP: ",
  'wificonn.working' => "Verbinden mit dem ausgewählten AP",
  'wificonn.fail' => "Verbindung fehlgeschlagen; prüfe die Einstellungen und versuche es erneut. Grund: ",

  // Access restrictions form

  'pwlock.title' => 'Zugriffsbeschränkungen',
  'pwlock.explain' => '
    Manche, oder alle Teile des Web-Interface können mit einem Passwort geschützt werden.
    Lass die Passwortfelder leer wenn du es sie verändern möchtest.<br>
    Das voreingestellte Passwort ist "%def_access_pw%".
  ',
  'pwlock.region' => 'Geschützte Seiten',
  'pwlock.region.none' => 'Keine, alles offen',
  'pwlock.region.settings_noterm' => 'WLAN-, Netzwerk- & Systemeinstellungen',
  'pwlock.region.settings' => 'Alle Einstellungsseiten',
  'pwlock.region.menus' => 'Dieser ganze Menüabschnitt',
  'pwlock.region.all' => 'Alles, sogar das Terminal',
  'pwlock.new_access_pw' => 'Neues Passwort',
  'pwlock.new_access_pw2' => 'Wiederholen',
  'pwlock.admin_pw' => 'Administratorpasswort',
  'pwlock.access_name' => 'Benutzername',

  // Setting admin password

  'adminpw.title' => 'Administratorpasswort ändern',
  'adminpw.explain' =>
    '
    Das "Administratorpasswort" wird benutzt, um die gespeicherten Standardeinstellungen und die Zugriffsbeschränkungen zu verändern. Dieses Passwort wird nicht als Teil der Hauptkonfiguration gespeichert, d.h. Speichern / Wiederherstellen wird das Passwort nicht beeinflussen. Wenn das Administratorpasswort vergessen wird, ist die einfachste Weise, wieder Zugriff zu erhalten, ein Re-flash des Chips.<br>
    Das voreingestellte Administratorpasswort ist "%def_admin_pw%".
    ',
  'adminpw.new_admin_pw' => 'Neues Administratorpasswort',
  'adminpw.new_admin_pw2' => 'Wiederholen',
  'adminpw.old_admin_pw' => 'Altes Administratorpasswort',

  // Persist form

  'persist.title' => 'Speichern & Wiederherstellen',
  'persist.explain' => '
    ESPTerm speichert alle Einstellungen im Flash-Speicher. Die aktiven Einstellungen können in den “Voreinstellungsbereich” kopiert werden und später wiederhergestellt werden mit der Taste unten.
    ',
  'persist.confirm_restore' => 'Alle Einstellungen zu den Voreinstellungen zurücksetzen?',
  'persist.confirm_restore_hard' =>
    'Zurücksetzen zu den Firmware-Voreinstellungen? Dies wird alle aktiven' .
    ' Einstellungen zürucksetzen und den AP-Modus aktivieren mit der Standard-SSID.',
  'persist.confirm_store_defaults' =>
    'Administratorpasswort eingeben um Voreinstellungen zu überschreiben',
  'persist.password' => 'Administratorpasswort:',
  'persist.restore_defaults' => 'Zu gespeicherten Voreinstellungen zurücksetzen',
  'persist.write_defaults' => 'Aktive Einstellungen als Voreinstellungen speichern',
  'persist.restore_hard' => 'Aktive Einstellungen zu Werkseinstellungen zurücksetzen',
  'persist.restore_hard_explain' => '(Dies löscht die WLAN-Konfiguration! Beeinflusst die gespeicherten Voreinstellungen oder das Administratorpasswort nicht.)',

  // UART settings form

  'uart.title' => 'Serienportparameter',
  'uart.explain' => '
    Dies steuert den Kommunikations-UART. Der Debug-UART ist auf 115.200 baud fest eingestellt mit einem Stop-Bit und keiner Parität.
    ',
  'uart.baud' => 'Baudrate',
  'uart.parity' => 'Parität',
  'uart.parity.none' => 'Keine',
  'uart.parity.odd' => 'Ungerade',
  'uart.parity.even' => 'Gerade',
  'uart.stop_bits' => 'Stop-Bits',
  'uart.stop_bits.one' => 'Eins',
  'uart.stop_bits.one_and_half' => 'Eineinhalb',
  'uart.stop_bits.two' => 'Zwei',

  // HW tuning form

  'hwtuning.title' => 'Hardware-Tuning',
  'hwtuning.explain' => '
    ESP8266 kann overclocked werden von 80&nbsp;MHz auf 160&nbsp;MHz.
    Alles wird etwas schneller sein, aber mit höherem Stromverbrauch, und eventuell auch mit höherer Interferenz. Mit Sorgfalt benutzen.
    ',
  'hwtuning.overclock' => 'Auf 160MHz Overclocken',

  // Generic button / dialog labels

  'apply' => 'Bestätigen!',
  'enabled' => 'Aktiviert',
  'disabled' => 'Deaktiviert',
  'yes' => 'Ja',
  'no' => 'Nein',
  'confirm' => 'OK',
  'form_errors' => 'Gültigkeitsfehler für:',
];
