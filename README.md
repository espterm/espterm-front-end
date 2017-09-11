# ESPTerm web interface

This repository contains the ESPTerm web interface source files.

## Installation

Run `yarn install` (if a `yarn.lock` file is present) to set up the build tools 
used for JS and SASS. (Otherwise, globally install `sass`.)

You also need PHP installed (preferably version >= 7, but older may work too).
PHP is used to build the HTML files and apply substitutions.

## Development

JavaScript source files can be found in the `js/` folder, SASS
files in the `sass/` folder.

Fontello (icon font) is maintained in the `fontello/` folder. To update Fontello, replace
the `fontello.zip` file and run `unpack.sh` in the same folder. This will extract the needed CSS
from the zip file and put them into the `sass/` folder to be included with the other styles.

To test you changes (after building JS and CSS), run a PHP local server in the project
directory using the `server.sh` script or by a command like `php -S 0.0.0.0:2000 _dev_router.php`.
Template substitutions (that are normally done by the ESPTerm's webserver) applied to the 
files fior testing can be defined in `_debug_replacements.php`.

### Template strings

Template strings are used to embed substitutions dynamically when serving the web page.
They have the format `%key%`, `%j:key%` or `%h:key%`, the prefix `j:` and `h:`
causes the value to be HTML- or JS-escaped.

HTML escape turns `'"<>` into HTML entities. JS escape turns `'"\<>\r\n` into the 
corresponding JS-string escape sequences (`<>` use `\u003C` and `\u003E`).

#### macOS Notes
To run `unpack.sh` and unpack Fontello icons on macOS, you must first install the GNU `grep` and `sed` and add them to your path, instead of using the pre-installed BSD versions.

## Building

To build the final JS and CSS files, run `build.sh`. This script also puts static versions 
of the HTML files in the `out/` folder to be retrieved by the ESPTerm's firmware build script.

Files with template substitutions use the `.tpl` suffix. This ensures they are not pre-gzipped
when building the ESPTerm firmware, as `.html` files are sent to the browser already compressed
to save file size and substitutions would not be possible.

### Demo build

If the env variable ESP_DEMO is set when running `build.sh`, those static HTML
files will be altered for use in the ESPTerm web demo (i.e. the JS will make
no attempts to communicate with the back-end and use dummy values instead).

All files use the `.html` suffix in a demo build and have replacements applied using 
`_debug_replacements.php`.


