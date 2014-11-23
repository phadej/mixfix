/* global describe */
"use strict";

var jsc = require("jsverify");
var _ = require("underscore");

var parser = require("../lib/mixfix.js").parser;

var number = parser.any.satisfy(_.isNumber);
var plus = parser.any.satisfy(function (x) { return x === "+"; });
var times = parser.any.satisfy(function (x) { return x === "*"; });
var open = parser.any.satisfy(function (x) { return x === "("; });
var close = parser.any.satisfy(function (x) { return x === ")"; });

function add(a, b) { return a + b; }
function mult(a, b) { return a * b; }

describe("simple sum parser", function () {
  var p = parser.combine(number, plus.right(number).many(), function (x, xs) {
    return xs.reduce(add, x);
  }).end();

  jsc.property("works for single number", "nat", function (n) {
    return p.parse([n]) === n;
  });

  jsc.property("works for two numbers", "nat", "nat", function (n, m) {
    return p.parse([n, "+", m]) === n + m;
  });

  jsc.property("works for non zero numbers", "nearray nat", function (ns) {
    var tokens = [ns[0]];
    for (var i = 1; i < ns.length; i++) {
      tokens.push("+");
      tokens.push(ns[i]);
    }

    return p.parse(tokens) === ns.reduce(add, 0);
  });
});

describe("sum and mult parser", function () {
  var multParser = parser.combine(number, times.right(number).many(), function (x, xs) {
    return xs.reduce(mult, x);
  });

  var sumParser = parser.combine(multParser, plus.right(multParser).many(), function (x, xs) {
    return xs.reduce(add, x);
  });

  var p = sumParser.end();

  jsc.property("works for single number", "nat", function (n) {
    return p.parse([n]) === n;
  });

  jsc.property("works for two numbers, addition", "nat", "nat", function (n, m) {
    return p.parse([n, "+", m]) === n + m;
  });

  jsc.property("works for non zero numbers, addition", "nearray nat", function (ns) {
    var tokens = [ns[0]];
    for (var i = 1; i < ns.length; i++) {
      tokens.push("+");
      tokens.push(ns[i]);
    }

    return p.parse(tokens) === ns.reduce(add, 0);
  });

  jsc.property("works for two numbers, multiplication", "nat", "nat", function (n, m) {
    return p.parse([n, "*", m]) === n * m;
  });

  jsc.property("works for non zero numbers, multiplication", "nearray nat", function (ns) {
    var tokens = [ns[0]];
    for (var i = 1; i < ns.length; i++) {
      tokens.push("*");
      tokens.push(ns[i]);
    }

    return p.parse(tokens) === ns.reduce(mult, 1);
  });

  jsc.property("1 + 2 * 3 === 7", function () {
    return p.parse([1, "+", 2, "*", 3]) === 7;
  });
});

describe("arith parser", function () {
  var sumParser;

  var termParser = parser.choice([
    number,
    open.right(parser.lazy(function () { return sumParser.apply(undefined, arguments); })).left(close),
  ]);

  var multParser = parser.combine(termParser, times.right(termParser).many(), function (x, xs) {
    return xs.reduce(mult, x);
  });

  sumParser = parser.combine(multParser, plus.right(multParser).many(), function (x, xs) {
    return xs.reduce(add, x);
  });

  var p = sumParser.end();

  jsc.property("works for single number", "nat", function (n) {
    return p.parse([n]) === n;
  });

  jsc.property("works for two numbers, addition", "nat", "nat", function (n, m) {
    return p.parse([n, "+", m]) === n + m;
  });

  jsc.property("works for non zero numbers, addition", "nearray nat", function (ns) {
    var tokens = [ns[0]];
    for (var i = 1; i < ns.length; i++) {
      tokens.push("+");
      tokens.push(ns[i]);
    }

    return p.parse(tokens) === ns.reduce(add, 0);
  });

  jsc.property("works for two numbers, multiplication", "nat", "nat", function (n, m) {
    return p.parse([n, "*", m]) === n * m;
  });

  jsc.property("works for non zero numbers, multiplication", "nearray nat", function (ns) {
    var tokens = [ns[0]];
    for (var i = 1; i < ns.length; i++) {
      tokens.push("*");
      tokens.push(ns[i]);
    }

    return p.parse(tokens) === ns.reduce(mult, 1);
  });

  jsc.property("1 + 2 * 3 === 7", function () {
    return p.parse([1, "+", 2, "*", 3]) === 7;
  });

  jsc.property("(1 + 2) * 3 === 9", function () {
    return p.parse(["(", 1, "+", 2, ")", "*", 3]) === 9;
  });
});
