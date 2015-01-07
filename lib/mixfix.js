/**
  # mixfix

  > mixfix expression parser

  [![Build Status](https://secure.travis-ci.org/phadej/mixfix.svg?branch=master)](http://travis-ci.org/phadej/mixfix)
  [![NPM version](https://badge.fury.io/js/mixfix.svg)](http://badge.fury.io/js/mixfix)
  [![Dependency Status](https://david-dm.org/phadej/mixfix.svg)](https://david-dm.org/phadej/mixfix)
  [![devDependency Status](https://david-dm.org/phadej/mixfix/dev-status.svg)](https://david-dm.org/phadej/mixfix#info=devDependencies)
  [![Code Climate](https://img.shields.io/codeclimate/github/phadej/mixfix.svg)](https://codeclimate.com/github/phadej/mixfix)

  [Based on: Parsing Mixfix Operators](http://link.springer.com/chapter/10.1007%2F978-3-642-24452-0_5)
*/

"use strict";

/// include parser.js
var parser = require("./parser.js");

/// include lexer.js
var lexer = require("./lexer.js");

module.exports = {
  lexer: lexer,
  parser: parser,
};

/// plain ../CHANGELOG.md
/// plain ../CONTRIBUTING.md
