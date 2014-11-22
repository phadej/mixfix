/* global describe */
"use strict";

var jsc = require("jsverify");
var _ = require("underscore");
var utils = require("../lib/utils.js");

describe("utils", function () {
  describe("uniq", function () {
    jsc.property("for numbers ≡ _.uniq", "array nat", function (arr) {
      return _.isEqual(utils.uniq(arr, utils.egal), _.uniq(arr));
    });

    jsc.property("for strings ≡ _.uniq", "array nat", function (arr) {
      return _.isEqual(utils.uniq(arr, utils.egal), _.uniq(arr));
    });

    jsc.property("but not for NaNs (egal!)", function () {
      var arr = [NaN, NaN];

      var a = utils.uniq(arr, utils.egal);
      var b = _.uniq(arr);

      return a.length === 1 && a[0] !== a[0] && b.length === 2;
    });
  });
});
