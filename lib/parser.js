"use strict";

/**
  ## parser

  > *Parser a = List token → Error ∨ NonEmptyList (a × List token)*

  Parsers are functions taking list of tokens and returning either error or possible parse results.
  In actual implementation `List token` is represented by an array of tokens and an index into it.
*/

var assert = require("assert");
var utils = require("./utils.js");

var VAL = 0;
var IDX = 1;

var bless;

function resultMap(result, f) {
  var res = [];
  var len = result.length;
  for (var i = 0; i < len; i++) {
    res.push([f(result[i][VAL]), result[i][IDX]]);
  }
  return res;
}

function resultFilter(result, predicate) {
  var res = [];
  var len = result.length;
  for (var i = 0; i < len; i++) {
    if (predicate(result[i][VAL])) {
      res.push(result[i]);
    }
  }

  if (res.length === 0) {
    return new Error("Empty filtered set");
  } else {
    return res;
  }
}

function resultIdx(result) {
  return result[IDX];
}

function isFunction(f) {
  return typeof f === "function";
}

/**
  - `parser.parse(@: Parser a, tokens: List token): a`

      Parse `tokens`. Returns first parse result.
*/
function prototypeParse(tokens) {
  /*jshint validthis:true */
  var result = this(tokens, 0);
  if (!Array.isArray(result)) {
    // Parse error
    throw result;
  }

  return result[0][VAL];
}

/**
  - `parser.map(@: Parser a, f: a -> b): Parser b`
*/
function prototypeMap(f) {
  /*jshint validthis:true */
  var p = this;
  return bless(p.maybeAcceptsEmpty, function (tokens, idx) {
    var result = p(tokens, idx);
    if (!Array.isArray(result)) {
      return result;
    } else {
      return resultMap(result, f);
    }
  });
}

/**
  - `parser.uniq(@: Parser a): Parser a`
*/
function prototypeUniq(eq) {
  /*jshint validthis:true */
  var p = this;
  eq = eq || utils.egal;

  return bless(p.maybeAcceptsEmpty, function (tokens, idx) {
    var result = p(tokens, idx);
    if (Array.isArray(result)) {
      return utils.uniq(result, function (a, b) {
        return a[IDX] === b[IDX] && eq(a[VAL], b[VAL]);
      });
    } else {
      return result;
    }
  });
}

/**
  - `parser.satisfy(@: Parser a, predicate: a -> Boolean): Parser a`
*/
function prototypeSatisfy(predicate) {
  /*jshint validthis:true */
  var p = this;

  return bless(p.maybeAcceptsEmpty, function (tokens, idx) {
    var result = p(tokens, idx);
    if (Array.isArray(result)) {
      return resultFilter(result, predicate);
    } else {
      return result;
    }
  });
}

/**
  - `parser.end(@: Parser a): Parser a`
*/
function prototypeEnd() {
  /*jshint validthis:true */
  var p = this;

  return bless(false, function (tokens, idx) {
    var tokensLength = tokens.length;
    var result = p(tokens, idx);

    var res = [];
    var len = result.length;
    for (var i = 0; i < len; i++) {
      if (result[i][IDX] === tokensLength) {
        res.push(result[i]);
      }
    }

    if (res.length === 0) {
      return new Error("Expected end-of-input");
    } else {
      return res;
    }
  });
}

function manySomeImpl(p, start, tokens) {
  var results = start;
  var prev = start;

  /* eslint-disable no-constant-condition */
  while (true) {
    var prevLength = prev.length;
    var next = [];
    for (var i = 0; i < prevLength; i++) {
      var tmp = p(tokens, prev[i][IDX]);

      if (Array.isArray(tmp)) {
        var tmpLength = tmp.length;
        for (var j = 0; j < tmpLength; j++) {
          next.push([prev[i][VAL].concat([tmp[j][VAL]]), tmp[j][IDX]]);
        }
      }
    }

    results = results.concat(next);
    prev = next;

    if (next.length === 0) {
      break;
    }
  }
  /* eslint-enable no-constant-condition */

  return results;
}

/**
  - `parser.many(@: Parser a): Parser (Array a)`
*/
function prototypeMany() {
  /*jshint validthis:true */
  var p = this;

  if (p.maybeAcceptsEmpty) {
    throw new Error("many with empty-accepting parser");
  }

  return bless(true, function (tokens, idx) {
    var results = [[[], idx]];
    return manySomeImpl(p, results, tokens);
  });
}

/**
  - `parser.some(@: Parser a): Parser (Array a)`
*/
function prototypeSome() {
  /*jshint validthis:true */
  var p = this;

  if (p.maybeAcceptsEmpty) {
    throw new Error("some with empty-accepting parser");
  }

  return bless(false, function (tokens, idx) {
    var first = p(tokens, idx);
    if (!Array.isArray(first)) {
      return first;
    }

    var results = resultMap(first, function (x) { return [x]; });
    return manySomeImpl(p, results, tokens);
  });
}

/**
  - `parser.left(@: Parser a, other: Parser b): Parser a`
*/
function prototypeLeft(other) {
  /*jshint validthis:true */
  var p = this;

  return bless(p.maybeAcceptsEmpty && other.maybeAcceptsEmpty, function (tokens, idx) {
    var result = p(tokens, idx);
    if (!Array.isArray(result)) {
      return result;
    }

    var next = [];
    var err;
    var errSet = false;

    var resultLength = result.length;

    for (var i = 0; i < resultLength; i++) {
      var tmp = other(tokens, result[i][IDX]);

      if (Array.isArray(tmp)) {
        var tmpLength = tmp.length;
        assert(tmpLength > 0);

        var idxs = utils.uniq(tmp.map(resultIdx), utils.egal);
        var idxsLength = idxs.length;

        for (var j = 0; j < idxsLength; j++) {
          next.push([result[i][VAL], idxs[j]]);
        }
      } else if (!errSet) {
        err = tmp;
        errSet = true;
      }
    }

    if (next.length === 0) {
      return err;
    } else {
      return next;
    }
  });
}

/**
  - `parser.right(@: Parser a, other: Parser b): Parser b`
*/
function prototypeRight(other) {
  /*jshint validthis:true */
  var p = this;

  return bless(p.maybeAcceptsEmpty && other.maybeAcceptsEmpty, function (tokens, idx) {
    var result = p(tokens, idx);
    if (!Array.isArray(result)) {
      return result;
    }

    var next = [];
    var err;
    var errSet = false;

    var idxs = utils.uniq(result.map(resultIdx), utils.egal);
    var idxsLength = idxs.length;

    for (var i = 0; i < idxsLength; i++) {
      var tmp = other(tokens, idxs[i]);

      if (Array.isArray(tmp)) {
        var tmpLength = tmp.length;
        assert(tmpLength > 0);

        for (var j = 0; j < tmpLength; j++) {
          next.push([tmp[j][VAL], tmp[j][IDX]]);
        }
      } else if (!errSet) {
        err = tmp;
        errSet = true;
      }
    }

    if (next.length === 0) {
      return err;
    } else {
      return next;
    }
  });
}

bless = function bless(maybeAcceptsEmpty, p) {
  assert(typeof maybeAcceptsEmpty === "boolean");
  assert(typeof p === "function");

  p.parse = prototypeParse;
  p.map = prototypeMap;
  p.uniq = prototypeUniq;
  p.satisfy = prototypeSatisfy;
  p.end = prototypeEnd;
  p.many = prototypeMany;
  p.some = prototypeSome;
  p.left = prototypeLeft;
  p.right = prototypeRight;
  p.maybeAcceptsEmpty = maybeAcceptsEmpty;
  return p;
};

/**
  - `pure(x: a): Parser a`
*/
function pure(x) {
  return bless(true, function (tokens, idx) {
    return [[x, idx]];
  });
}

/**
  - `fail(error: Err): Parser a`
*/
function fail(err) {
  return bless(false, function () {
    return new Error(err);
  });
}

/**
  - `any: Parser a`
*/
var any = bless(false, function any(tokens, idx) {
  if (idx < tokens.length) {
    return [[tokens[idx], idx + 1]];
  } else {
    return new Error("expected anything, end-of-input found");
  }
});

/**
  - `combine(p: Parser a..., f: a... -> b): Parser b`
*/
function combine() {
  var parsers = utils.flatten(Array.prototype.slice.call(arguments, 0, -1));
  var parsersLength = parsers.length;
  var f = arguments[arguments.length - 1];

  assert(parsers.every(isFunction), "combine parsers should be functions");
  assert(isFunction(f), "combine combinator (last argument) should be function");

  var maybeAcceptsEmpty = parsers.every(function (p) { return p.maybeAcceptsEmpty; });

  return bless(maybeAcceptsEmpty, function (tokens, idx) {
    var results = parsers[0](tokens, idx);
    if (!Array.isArray(results)) {
      return results;
    }
    results = resultMap(results, function (x) { return [x]; });

    for (var i = 1; i < parsersLength; i++) {
      var p = parsers[i];
      var resultsLength = results.length;

      assert(resultsLength > 0);

      var next = [];
      var err;
      var errSet = false;

      for (var j = 0; j < resultsLength; j++) {
        var tmp = p(tokens, results[j][IDX]);
        if (Array.isArray(tmp)) {
          for (var k = 0; k < tmp.length; k++) {
            next.push([results[j][VAL].concat([tmp[k][VAL]]), tmp[k][IDX]]);
          }
        } else if (!errSet) {
          err = tmp;
          errSet = true;
        }
      }

      if (next.length === 0) {
        return err;
      }

      results = next;
    }

    results = resultMap(results, function (x) { return f.apply(undefined, x); });

    return results;
  });
}

/**
  - `choice(p: Parser a | List (Parser a)...): Parser a`
*/
function choice() {
  var args = Array.prototype.slice.call(arguments);
  var parsers = utils.flatten(args);
  var parsersLength = parsers.length;

  assert(parsers.every(isFunction), "choice parsers should be functions");

  if (parsersLength === 0) {
    return fail("empty choice");
  }

  var maybeAcceptsEmpty = parsers.some(function (p) { return p.maybeAcceptsEmpty; });

  return bless(maybeAcceptsEmpty, function (tokens, idx) {
    var results = [];
    var err;
    var errSet = false;

    for (var i = 0; i < parsersLength; i++) {
      var tmp = parsers[i](tokens, idx);
      if (Array.isArray(tmp)) {
        assert(tmp.length > 0);
        results = results.concat(tmp);
      } else if (!errSet) {
        err = tmp;
        errSet = true;
      }
    }

    if (results.length === 0) {
      return err;
    } else {
      return results;
    }
  });
}

/**
  - `lazy(f: => Parser a): Parser a`
*/
function lazy(f) {
  return bless(true, function (tokens, idx) {
    return f(tokens, idx);
  });
}

module.exports = {
  pure: pure,
  fail: fail,
  any: any,
  combine: combine,
  choice: choice,
  lazy: lazy,
};
