/** Init the terminal sub-module - called from HTML */
window.termInit = function (labels, theme) {
  Conn.init()
  Input.init()
  TermUpl.init()
  Screen.load(labels, theme) // populate labels
}
