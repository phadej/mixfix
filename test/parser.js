/* global describe */
"use strict";

var jsc = require("jsverify");
var _ = require("underscore");

var parser = require("../lib/mixfix.js").parser;

function apply(f, x) { return f(x); }

function resultsEqual(r1, r2) {
  if (r1 instanceof Error) {
    return (r2 instanceof Error) && r1.message === r2.message;
  } else {
    return _.isEqual(r1, r2);
  }
}

function resultsAlmostEqual(r1, r2) {
  if (r1 instanceof Error) {
    return (r2 instanceof Error);
  } else {
    return _.isEqual(r1, r2);
  }
}

function failsWith(p, tokens, message) {
  try {
    p.parse(tokens);
    return false;
  } catch (exc) {
    return message === undefined || exc.message === message;
  }
}

describe("parser", function () {
  describe("pure", function () {
    jsc.property("always succeeds", "nat", "array nat", function (n, tokens) {
      var p = parser.pure(n);
      return p.parse(tokens) === n;
    });
  });

  describe("fail", function () {
    jsc.property("always fails", "string", "array nat", function (err, tokens) {
      var p = parser.fail(err);
      return failsWith(p, tokens, err);
    });
  });

  describe("map", function () {
    jsc.property("maps successful result", "nat", "nat -> nat", function (n, f) {
      var p = parser.pure(n).map(f);
      return p.parse([]) === f(n);
    });

    jsc.property("is chainable", "nat", "nat -> nat", "nat -> nat", function (n, f, g) {
      var p = parser.pure(n).map(f).map(g);
      return p.parse([]) === g(f(n));
    });

    jsc.property("forms functor", "nat", "nat -> nat", "nat -> nat", function (n, f, g) {
      var p1 = parser.pure(n).map(f).map(g);
      var p2 = parser.pure(n).map(_.compose(g, f));

      var x1 = p1.parse([]);
      var x2 = p2.parse([]);
      return x1 === x2 && x1 === g(f(n));
    });

    jsc.property("doesn't touch errorneous parse", "string", "nat -> nat", function (err, f) {
      var p = parser.fail(err).map(f);
      return failsWith(p, [], err);
    });
  });

  describe("any", function () {
    jsc.property("fails on empty input", function () {
      return failsWith(parser.any, []);
    });
  });

  describe("combine", function () {
    jsc.property("with single parser ≡ p.map(f)", "nat", "nat -> nat", function (n, f) {
      var p = parser.combine(parser.pure(n), f);
      return p.parse([]) === f(n);
    });

    jsc.property("with single parser ≡ p.map(f), error", "string", "nat -> nat", function (err, f) {
      var p = parser.combine(parser.fail(err), f);
      return failsWith(p, [], err);
    });

    jsc.property("applicative: identity law", "nat", function (n) {
      var p = parser.combine(parser.pure(_.identity), parser.pure(n), apply);
      return p.parse([]) === n;
    });

    jsc.property("applicative: identity law, any", "array nat", function (tokens) {
      var p1 = parser.combine(parser.pure(_.identity), parser.any, apply);
      var p2 = parser.any;

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("applicative: identity law, error", "string", function (err) {
      var p = parser.combine(parser.pure(_.identity), parser.fail(err), apply);
      return failsWith(p, [], err);
    });

    jsc.property("applicative: two errors - first returned", "string", "string", function (err1, err2) {
      var p = parser.combine(parser.fail(err1), parser.fail(err2), apply);
      return failsWith(p, [], err1);
    });

    jsc.property("applicative: homomorphism law", "nat -> nat", "nat", "array nat", function (f, n, tokens) {
      var p1 = parser.combine(parser.pure(f), parser.pure(n), apply);
      var p2 = parser.pure(f(n));

      var x1 = p1.parse(tokens);
      var x2 = p2.parse(tokens);
      var x3 = f(n);

      return x1 === x2 && x2 === x3;
    });

    jsc.property("parse two first nats", "array nat", function (tokens) {
      var p = parser.combine(parser.any, parser.any, function (a, b) { return a + b; });

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        return p.parse(tokens) === tokens[0] + tokens[1];
      }
    });

    jsc.property("parse two first nats, spread", "array nat", function (tokens) {
      var p = parser.combine([
          parser.any,
          parser.any,
        ], function (a, b) { return a + b; });

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        return p.parse(tokens) === tokens[0] + tokens[1];
      }
    });
  });

  describe("choice", function () {
    jsc.property("empty choice ≡ fail", "array nat", function (tokens) {
      var p = parser.choice();
      return failsWith(p, tokens);
    });

    jsc.property("empty choice ≡ fail, empty arrays as input", "array nat", function (tokens) {
      var p = parser.choice([], [], []);
      return failsWith(p, tokens);
    });

    jsc.property("fail is left identity", "array nat", function (tokens) {
      var p1 = parser.choice(parser.fail("err"), parser.any);
      var p2 = parser.any;

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsAlmostEqual(r1, r2);
    });

    jsc.property("fail is right identity", "array nat", function (tokens) {
      var p1 = parser.choice(parser.any, parser.fail("err"));
      var p2 = parser.any;

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("may cause combinatorial explosion", "array nat", function (tokens) {
      var p = parser.choice(parser.any, parser.any);

      if (tokens.length < 1) {
        return failsWith(p, tokens);
      } else {
        return p.parse(tokens) === tokens[0];
      }
    });

    jsc.property("may cause combinatorial explosion, 2", "array nat", function (tokens) {
      var one = parser.choice(parser.any, parser.any);
      var p = parser.combine(one, one, function (a, b) { return a + b; });

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        var r = p(tokens, 0);
        return r.length === 4 && r.every(function (x) {
          return x[0] === tokens[0] + tokens[1];
        });
      }
    });
  });

  describe("uniq", function () {
    jsc.property("may help with combinatorial explosion, 1", "array nat", function (tokens) {
      var one = parser.choice(parser.any, parser.any);
      var p = parser.combine(one.uniq(), one, function (a, b) { return a + b; });

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        var r = p(tokens, 0);
        return r.length === 2 && r.every(function (x) {
          return x[0] === tokens[0] + tokens[1];
        });
      }
    });

    jsc.property("may help with combinatorial explosion, 2", "array nat", function (tokens) {
      var one = parser.choice(parser.any, parser.any);
      var p = parser.combine(one, one.uniq(), function (a, b) { return a + b; });

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        var r = p(tokens, 0);
        return r.length === 2 && r.every(function (x) {
          return x[0] === tokens[0] + tokens[1];
        });
      }
    });

    jsc.property("may help with combinatorial explosion, 2", "array nat", function (tokens) {
      var one = parser.choice(parser.any, parser.any);
      var p = parser.combine(one, one, function (a, b) { return a + b; }).uniq();

      if (tokens.length < 2) {
        return failsWith(p, tokens);
      } else {
        var r = p(tokens, 0);
        return r.length === 1 && r[0][0] === tokens[0] + tokens[1];
      }
    });
  });

  describe("satisfy", function () {
    jsc.property("p.satisfy(constant(false)) ≡ fail", "nat", "array nat", function (n, tokens) {
      var p = parser.pure(n).satisfy(function () { return false; });
      return failsWith(p, tokens);
    });

    jsc.property("p.satisfy(constant(true)) ≡ p", "array nat", function (tokens) {
      var p1 = parser.any;
      var p2 = p1.satisfy(function () { return true; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("is idempotent", "nat -> bool", "array nat", function (predicate, tokens) {
      var p1 = parser.any.satisfy(predicate);
      var p2 = p1.satisfy(predicate);

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });
  });

  describe("end", function () {
    jsc.property("succeeds if on end-of-input", "nat", function (n) {
      var p = parser.pure(n).end();
      return p.parse([]) === n;
    });

    jsc.property("fails if there is input", "nat", "nat", function (n, m) {
      var p = parser.pure(n).end();
      return failsWith(p, [m]);
    });
  });

  describe("many", function () {
    jsc.property("any.many.end returns token list as is", "array nat", function (tokens) {
      var p = parser.any.many().end();
      return _.isEqual(p.parse(tokens), tokens);
    });

    jsc.property("any.many returns as much results as there are tokens + empty one", "array nat", function (tokens) {
      var p = parser.any.many();
      return p(tokens, 0).length === tokens.length + 1;
    });

    jsc.property("many.many fails", function () {
      try {
        parser.any.many().many();
        return false;
      } catch (exc) {
        return true;
      }
    });
  });

  describe("some", function () {
    jsc.property("any.some.end returns non-empty token list as is", "nearray nat", function (tokens) {
      var p = parser.any.some().end();
      return _.isEqual(p.parse(tokens), tokens);
    });

    jsc.property("some fails on empty input", function () {
      var p = parser.any.some().end();
      return failsWith(p, []);
    });

    jsc.property("many.some fails", function () {
      try {
        parser.any.many().some();
        return false;
      } catch (exc) {
        return true;
      }
    });
  });

  describe("left", function () {
    jsc.property("a.left(b) ≡ combine(a, b, (x, y) ⇒ x)", "array nat", function (tokens) {
      var a = parser.any;
      var b = parser.any;

      var p1 = a.left(b);
      var p2 = parser.combine(a, b, function (x) { return x; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("a.left(b) ≡ combine(a, b, (x, y) ⇒ x), choice", "array nat", function (tokens) {
      var a = parser.choice(parser.any, parser.any);
      var b = parser.choice(parser.any, parser.any);

      var p1 = a.left(b);
      var p2 = parser.combine(a, b.uniq(), function (x) { return x; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("with pure on left", "nat", "array nat", function (n, tokens) {
      var p1 = parser.any.left(parser.pure(n));
      var p2 = parser.any;

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("with pure on right", "nat", "array nat", function (n, tokens) {
      var p = parser.pure(n).left(parser.any);

      if (tokens.length === 0) {
        return failsWith(p, tokens);
      } else {
        return p.parse(tokens) === n;
      }
    });
  });

  describe("right", function () {
    jsc.property("a.right(b) ≡ combine(a, b, (x, y) ⇒ y)", "array nat", function (tokens) {
      var a = parser.any;
      var b = parser.any;

      var p1 = a.right(b);
      var p2 = parser.combine(a, b, function (x, y) { return y; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("a.right(b) ≡ combine(a, b, (x, y) ⇒ y), choice", "array nat", function (tokens) {
      var a = parser.choice(parser.any, parser.any);
      var b = parser.choice(parser.any, parser.any);

      var p1 = a.right(b);
      var p2 = parser.combine(a.uniq(), b, function (x, y) { return y; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("a.right(b) ≡ combine(a, b, (x, y) ⇒ y), special", "array nat", function (tokens) {
      var a = parser.choice(parser.any, parser.any.left(parser.any));
      var b = parser.any.left(parser.any);

      var p1 = a.right(b);
      var p2 = parser.combine(a, b, function (x, y) { return y; });

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });

    jsc.property("with pure on left", "nat", "array nat", function (n, tokens) {
      var p = parser.any.right(parser.pure(n));

      if (tokens.length === 0) {
        return failsWith(p, tokens);
      } else {
        return p.parse(tokens) === n;
      }
    });

    jsc.property("with pure on right", "nat", "array nat", function (n, tokens) {
      var p1 = parser.pure(n).right(parser.any);
      var p2 = parser.any;

      var r1 = p1(tokens, 0);
      var r2 = p2(tokens, 0);

      return resultsEqual(r1, r2);
    });
  });

  describe("lazy", function () {
    var parser0 = parser.any.satisfy(function (x) { return x === 0; });
    var parser1 = parser.any.satisfy(function (x) { return x === 1; });

    var parser01 = parser.choice([
      parser.combine([
          parser0,
          parser.lazy(function () { return parser01.apply(undefined, arguments); }),
          parser1,
        ], function (unused, b) {
          return b + 1;
        }),
      parser.pure(0)]);

    var p = parser01.end();

    jsc.property("empty input", function () {
      return p.parse([]) === 0;
    });

    jsc.property("simple input", function () {
      return p.parse([0, 0, 1, 1]) === 2;
    });

    jsc.property("arbitrary correct input", "nat", function (n) {
      var tokens = [];
      var i;

      for (i = 0; i < n; i++) {
        tokens.push(0);
      }
      for (i = 0; i < n; i++) {
        tokens.push(1);
      }

      return p.parse(tokens) === n;
    });
  });
});
