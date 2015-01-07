"use strict";

var assert = require("assert");

// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
  ## lexer

  A very simple lexer.
*/

/**
  - `lexer.create(specification: List (String | RegExp)): String -> List String`

      Creates a tokenizer function.
*/
function create(specification) {
  specification = specification.map(function (t) {
    if (typeof t === "string") {
      return escapeRegExp(t);
    } else if (t instanceof RegExp) {
      return t.toString().replace(/^\//, "").replace(/\/$/, "");
    } else {
      throw new Error("unsupported token type: " + typeof t);
    }
  });

  var allRegExp = new RegExp("^(" + specification.join("|") + ")*$");
  var partsRegExp = new RegExp("(" + specification.join("|") + ")", "g");

  return function lexerImpl(str) {
    // Empty string, always succeed
    if (str === "") {
      return [];
    }

    var m;
    m = allRegExp.test(str);
    if (m === false) {
      throw new Error("Cannot tokenize");
    }

    m = str.match(partsRegExp);
    assert(Array.isArray(m), ".match(partsRegExp) should always succeed");
    return m;
  };
}

module.exports = {
  create: create,
};
