
<div class="Box fold">
	<h2>Commands: Color Attributes</h2>

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

		<p>
			Background image can be set using `\e]70;<i>url</i>\a` (see section System Functions).
		</p>

		<h3>Foreground colors</h3>

		<div class="colorprev">
			<span data-bg="0" data-fg="0" style="text-shadow: 0 0 3px white;">30</span><!--
			--><span data-bg="0" data-fg="1">31</span><!--
			--><span data-bg="0" data-fg="2">32</span><!--
			--><span data-bg="0" data-fg="3">33</span><!--
			--><span data-bg="0" data-fg="4">34</span><!--
			--><span data-bg="0" data-fg="5">35</span><!--
			--><span data-bg="0" data-fg="6">36</span><!--
			--><span data-bg="0" data-fg="7">37</span>
		</div>

		<div class="colorprev">
			<span data-bg="0" data-fg="8">90</span><!--
			--><span data-bg="0" data-fg="9">91</span><!--
			--><span data-bg="0" data-fg="10">92</span><!--
			--><span data-bg="0" data-fg="11">93</span><!--
			--><span data-bg="0" data-fg="12">94</span><!--
			--><span data-bg="0" data-fg="13">95</span><!--
			--><span data-bg="0" data-fg="14">96</span><!--
			--><span data-bg="0" data-fg="15">97</span>
		</div>

		<h3>Background colors</h3>

		<div class="colorprev">
			<span data-bg="0" data-fg="15">40</span><!--
			--><span data-bg="1" data-fg="15">41</span><!--
			--><span data-bg="2" data-fg="15">42</span><!--
			--><span data-bg="3" data-fg="0">43</span><!--
			--><span data-bg="4" data-fg="15">44</span><!--
			--><span data-bg="5" data-fg="15">45</span><!--
			--><span data-bg="6" data-fg="15">46</span><!--
			--><span data-bg="7" data-fg="0">47</span>
		</div>

		<div class="colorprev">
			<span data-bg="8" data-fg="15">100</span><!--
			--><span data-bg="9" data-fg="0">101</span><!--
			--><span data-bg="10" data-fg="0">102</span><!--
			--><span data-bg="11" data-fg="0">103</span><!--
			--><span data-bg="12" data-fg="15">104</span><!--
			--><span data-bg="13" data-fg="0">105</span><!--
			--><span data-bg="14" data-fg="0">106</span><!--
			--><span data-bg="15" data-fg="0">107</span>
		</div>

		<h3>256-color palette</h3>

		<p>
			ESPTerm supports in total 256 standard colors. The dark and bright basic colors are
			numbered 0-7 and 8-15. To use colors higher than 15 (or 0-15 using this simpler numbering),
			send `CSI 38 ; 5 ; <i>n</i> m`, where `n` is the color to set. Use `CSI 48 ; 5 ; <i>n</i> m` for background colors.
		</p>

		<div class="colorprev" id="pal256">
		</div>
	</div>
</div>

<script>
	$.ready(function() {
	  var wrap = qs('#pal256');
	  var table = themes.buildColorTable();
	  for (var i = 0; i < 256; i++) {
	    var el = document.createElement('span')
	    var clr = table[i]
	    if (i < 16) {
	      clr = themes.themes[1][i]
        }
        el.style.color = 'black'
        if ( i < 7 || i == 12 || i == 8 ||
          (i >= 16 && i <= 33) ||
          (i >= 52 && i <= 69) ||
          (i >= 88 && i <= 99) ||
          (i >= 124 && i <= 129)) {
	      el.style.color = 'white'
        }
	    el.textContent = ""+i
	    el.style.backgroundColor = clr
        wrap.appendChild(el)

	    if (i==15||(i-16)%24==23) {
          el = document.createElement('br')
            wrap.appendChild(el)
	    }
	  }
	});
</script>
