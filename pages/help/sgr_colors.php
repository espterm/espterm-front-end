
<div class="Box fold theme-1">
	<h2>Commands: Color SGR</h2>

	<div class="Row v">
		<p>
			Colors are set using SGR commands (like `\e[30;47m`). The following tables list the SGR
			codes to use. Selected colors are used for any new text entered, as well as for empty
			space when using clearing commands (except screen reset `\ec`, which first clears all
			style attriutes. The configured default colors can be restored using `SGR 39` for
			foreground and `SGR 49` for background.
		</p>

		<p>
			The actual color representation of the basic 16 colors depends on a color theme which
			can be selected in <a href="<?= url('cfg_term') ?>">Terminal Settings</a>.
		</p>

		<h3>Foreground colors</h3>

		<div class="colorprev">
			<span class="bg7 fg0">30</span>
			<span class="bg0 fg1">31</span>
			<span class="bg0 fg2">32</span>
			<span class="bg0 fg3">33</span>
			<span class="bg0 fg4">34</span>
			<span class="bg0 fg5">35</span>
			<span class="bg0 fg6">36</span>
			<span class="bg0 fg7">37</span>
		</div>

		<div class="colorprev">
			<span class="bg0 fg8">90</span>
			<span class="bg0 fg9">91</span>
			<span class="bg0 fg10">92</span>
			<span class="bg0 fg11">93</span>
			<span class="bg0 fg12">94</span>
			<span class="bg0 fg13">95</span>
			<span class="bg0 fg14">96</span>
			<span class="bg0 fg15">97</span>
		</div>

		<h3>Background colors</h3>

		<div class="colorprev">
			<span class="bg0 fg15">40</span>
			<span class="bg1 fg15">41</span>
			<span class="bg2 fg15">42</span>
			<span class="bg3 fg0">43</span>
			<span class="bg4 fg15">44</span>
			<span class="bg5 fg15">45</span>
			<span class="bg6 fg15">46</span>
			<span class="bg7 fg0">47</span>
		</div>

		<div class="colorprev">
			<span class="bg8 fg15">100</span>
			<span class="bg9 fg0">101</span>
			<span class="bg10 fg0">102</span>
			<span class="bg11 fg0">103</span>
			<span class="bg12 fg0">104</span>
			<span class="bg13 fg0">105</span>
			<span class="bg14 fg0">106</span>
			<span class="bg15 fg0">107</span>
		</div>

		<h3>256-color palette</h3>

		<p>
			ESPTerm supports in total 256 standard colors. The dark and bright basic colors are
			numbered 0-7 and 8-15. To use colors higher than 15 (or 0-15 using this simpler numbering),
			send `CSI 38 ; 5 ; <i>n</i> m`, where `n` is the color to set. Use 48 for background colors.
		</p>

		<p>
			For a fererence of all 256 shades please refer to
			<a href="https://jonasjacek.github.io/colors/">jonasjacek.github.io/colors</a>
			or look it up elsewhere.
		</p>
	</div>
</div>
