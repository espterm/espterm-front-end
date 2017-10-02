/*
 * This is a Webpack loader.
 * Loads language PHP files by parsing the PHP syntax and returning a Javascript
 * Object. This is because using JSON instead of PHP would not allow multiline
 * strings, and CSON is unsupported by PHP, and because splitting the language
 * files into PHP and JSON seems unwieldy.
 */

const selectedKeys = require('./keys')

const tokenizeRest = function (tokens, tokenize, ...args) {
  let i = 0

  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') {
      tokens.splice(i, 1, ...tokenize(tokens[i], ...args))
    }
    i++
  }

  return tokens
}

const tokenizers = {
  simpleType (code, regex, type, matchIndex = 1) {
    let tokens = []
    let match

    while ((match = code.match(regex))) {
      let before = code.substr(0, match.index)
      code = code.substr(match.index + match[0].length)

      if (before) tokens.push(before)
      tokens.push({
        type,
        match,
        content: match[matchIndex]
      })
    }

    if (code) tokens.push(code)

    return tokens
  }
}

const unescapeString = function (token) {
  if (token.match[1] === "'") {
    // single-quoted string only has \\ and \'
    return token.content.replace(/\\[\\']/g, match => match[1])
  } else {
    // double-quoted string
    // \n -> 0x0A
    // \r -> 0x0D
    // \t -> 0x09
    // \v -> 0x0B
    // \e -> 0x1B
    // \f -> 0x0C
    // \\ -> \
    // \$ -> $
    // \" -> "
    // \[0-7]{1,3} -> char
    // \x[\da-f]{1,2} -> char
    // \u{[\da-f]+} -> char
    let content = token.content
    content = content.replace(/\\[nrtvef\\$"]/g, match => match[1])
    content = content.replace(/\\[0-7]{1,3}/g, match => {
      return String.fromCodePoint(parseInt(match.substr(1), 8) % 0xFF)
    })
    content = content.replace(/\\x[\da-f]{1,2}/ig, match => {
      return String.fromCodePoint(parseInt(match.substr(1), 16) % 0xFF)
    })
    content = content.replace(/\\u{[\da-f]+}/ig, match => {
      return String.fromCodePoint(parseInt(match.substr(1), 16))
    })
    return content
  }
}

module.exports = function (source) {
  let originalSource = source

  // remove PHP header
  source = source.replace(/^\s*<\?(?:php)?\s*/, '')

  // remove return statement
  source = source.replace(/^return\s*/, '')

  // remove trailing semicolon
  source = source.replace(/;\s*$/, '')

  // strings
  let tokens = tokenizeRest([source], tokenizers.simpleType, /(['"])((?:\\.|[^\\\1])*?)\1/, 'string', 2)

  // comments
  tokenizeRest(tokens, tokenizers.simpleType, /\/\/(.*)/, 'comment')

  // map delimiters
  tokenizeRest(tokens, tokenizers.simpleType, /([[\]])/, 'map')

  // arrows
  tokenizeRest(tokens, tokenizers.simpleType, /(=>)/, 'arrow')

  // commas
  tokenizeRest(tokens, tokenizers.simpleType, /(,)/, 'comma')

  // whitespace
  tokenizeRest(tokens, tokenizers.simpleType, /(\s+)/, 'whitespace')

  // remove whitespace tokens and comments
  tokens = tokens.filter(token => !(['whitespace', 'comment'].includes(token.type)))

  // split tokens into an array of items, separated by commas
  let currentItem = []
  let items = [currentItem]

  for (let token of tokens) {
    let { type } = token

    if (type === 'map') continue
    if (type === 'comma') items.push(currentItem = [])
    else currentItem.push(token)
  }

  // remove null items
  items = items.filter(item => item.length)

  // assume that every item will contain [string, arrow, string] and create
  // an object
  let data = {}

  for (let item of items) {
    let key = item[0]
    let value = item[2]

    if (!key || !value) {
      console.error('Item has no key or value!', item)
      continue
    }

    data[unescapeString(key)] = unescapeString(value)
  }

  let result = {}

  // put selected keys in result
  for (let key of selectedKeys) {
    result[key] = data[key]
  }

  // adapted from webpack/loader-utils
  let remainingRequest = this.remainingRequest
  if (!remainingRequest) {
    remainingRequest = this.loaders.slice(this.loaderIndex + 1)
      .map(obj => obj.request)
      .concat([this.resource]).join('!')
  }

  let currentRequest = this.currentRequest
  if (!currentRequest) {
    remainingRequest = this.loaders.slice(this.loaderIndex)
      .map(obj => obj.request)
      .concat([this.resource]).join('!')
  }

  let map = {
    version: 3,
    file: currentRequest,
    sourceRoot: '',
    sources: [remainingRequest],
    sourcesContent: [originalSource],
    names: [],
    mappings: 'AAAA;AAAA'
  }

  this.callback(null, `/* Generated language file */
module.exports=${JSON.stringify(result)}`, map)
}
