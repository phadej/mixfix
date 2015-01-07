/* global describe */
"use strict";

var jsc = require("jsverify");
var _ = require("underscore");

var lexer = require("../lib/mixfix.js").lexer;

var jscEnv = {
  fooOrBar: jsc.elements(["foo", "bar"]),
};

describe("lexer", function () {
  jsc.property("throws if specification contains not strings or regexps", function () {
    try {
      lexer.create([1, 2]);
      return false;
    } catch (e) {
      return true;
    }
  });

  jsc.property("specification may contain string tokens", "array fooOrBar", jscEnv, function (arr) {
    var l = lexer.create([
      "foo",
      "bar",
    ]);

    return _.isEqual(l(arr.join("")), arr);
  });

  jsc.property("specification may contain regexp tokens", "array fooOrBar", jscEnv, function (arr) {
    var l = lexer.create([
      /fo+/,
      "bar",
    ]);

    return _.isEqual(l(arr.join("")), arr);
  });

  jsc.property("throws if can't tokenize", "array fooOrBar", jscEnv, function (arr) {
    var l = lexer.create([
      "foo",
      "bar",
    ]);

    try {
      l(arr.join("").concat("quux"));
    } catch (e) {
      return true;
    }
  });
});
