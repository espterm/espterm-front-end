// Bits in the cell attribs word

/* eslint-disable no-multi-spaces */
exports.ATTR_FG        = (1 << 0)  // 1 if not using default background color (ignore cell bg) - color extension bit
exports.ATTR_BG        = (1 << 1)  // 1 if not using default foreground color (ignore cell fg) - color extension bit
exports.ATTR_BOLD      = (1 << 2)  // Bold font
exports.ATTR_UNDERLINE = (1 << 3)  // Underline decoration
exports.ATTR_INVERSE   = (1 << 4)  // Invert colors - this is useful so we can clear then with SGR manipulation commands
exports.ATTR_BLINK     = (1 << 5)  // Blinking
exports.ATTR_ITALIC    = (1 << 6)  // Italic font
exports.ATTR_STRIKE    = (1 << 7)  // Strike-through decoration
exports.ATTR_OVERLINE  = (1 << 8)  // Over-line decoration
exports.ATTR_FAINT     = (1 << 9)  // Faint foreground color (reduced alpha)
exports.ATTR_FRAKTUR   = (1 << 10) // Fraktur font (unicode substitution)
/* eslint-enable no-multi-spaces */
