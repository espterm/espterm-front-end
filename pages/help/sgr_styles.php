<div class="Box fold">
	<h2>Commands: Style SGR</h2>

	<div class="Row v">
		<p>
			All text attributes are set using SGR commands like `\e[1;4m`, with up to 10 numbers separated by semicolons.
			To restore all attributes to their default states, use SGR 0: `\e[0m` or `\e[m`.
		</p>

		<p>Those are the supported text attributes SGR codes:</p>

		<table>
			<thead><tr><th>Style</th><th>Enable</th><th>Disable</th></tr></thead>
			<tbody>
			<tr><td><b>Bold</b></td><td>1</td><td>21, 22</td></tr>
			<tr><td style="opacity:.6">Faint</td><td>2</td><td>22</td></tr>
			<tr><td><i>Italic</i></td><td>3</td><td>23</td></tr>
			<tr><td><u>Underlined</u></td><td>4</td><td>24</td></tr>
			<tr><td><s>Striked</s></td><td>9</td><td>29</td></tr>
			<tr><td style="text-decoration: overline;">Overline</td><td>53</td><td>55</td></tr>
			<tr><td><span id="blinkdemo">Blink</span></td><td>5</td><td>25</td></tr>
			<tr><td><span style="color:black;background:#ccc;">Inverse</span></td><td>7</td><td>27</td></tr>
			<tr><td>𝔉𝔯𝔞𝔨𝔱𝔲𝔯</td><td>20</td><td>23</td></tr>
			<tr><td>Conceal<sup>1</sup></td><td>8</td><td>28</td></tr>
			</tbody>
		</table>
		<p><sup>1</sup>Conceal turns all characters invisible.</p>
	</div>
</div>

<script>
	setInterval(function() {
	  qs('#blinkdemo').className='';
      setTimeout(function() {
        qs('#blinkdemo').className='invisible';
      }, 750);
	}, 1000);
</script>
