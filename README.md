# mixfix

> mixfix expression parser

[![Build Status](https://secure.travis-ci.org/phadej/mixfix.svg?branch=master)](http://travis-ci.org/phadej/mixfix)
[![NPM version](https://badge.fury.io/js/mixfix.svg)](http://badge.fury.io/js/mixfix)
[![Dependency Status](https://david-dm.org/phadej/mixfix.svg)](https://david-dm.org/phadej/mixfix)
[![devDependency Status](https://david-dm.org/phadej/mixfix/dev-status.svg)](https://david-dm.org/phadej/mixfix#info=devDependencies)
[![Code Climate](https://img.shields.io/codeclimate/github/phadej/mixfix.svg)](https://codeclimate.com/github/phadej/mixfix)

[Based on: Parsing Mixfix Operators](http://link.springer.com/chapter/10.1007%2F978-3-642-24452-0_5)


## parser

> *Parser a = List token → Error ∨ NonEmptyList (a × List token)*

Parsers are functions taking list of tokens and returning either error or possible parse results.
In actual implementation `List token` is represented by an array of tokens and an index into it.


- `parser.parse(@: Parser a, tokens: List token): a`

    Parse `tokens`. Returns first parse result.


- `parser.map(@: Parser a, f: a -> b): Parser b`


- `parser.uniq(@: Parser a): Parser a`


- `parser.satisfy(@: Parser a, predicate: a -> Boolean): Parser a`


- `parser.end(@: Parser a): Parser a`


- `parser.many(@: Parser a): Parser (Array a)`


- `parser.some(@: Parser a): Parser (Array a)`


- `parser.left(@: Parser a, other: Parser b): Parser a`


- `parser.right(@: Parser a, other: Parser b): Parser b`


- `pure(x: a): Parser a`


- `fail(error: Err): Parser a`


- `any: Parser a`


- `combine(p: Parser a..., f: a... -> b): Parser b`


- `choice(p: Parser a | List (Parser a)...): Parser a`


- `lazy(f: => Parser a): Parser a`



## Release History

- **0.0.1** *2014-11-23* Parser combinators

## Contributing

- `README.md` is generated from the source with [ljs](https://github.com/phadej/ljs)
- Before creating a pull request run `make test`, yet travis will do it for you.
