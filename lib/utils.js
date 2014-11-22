"use strict";

function flatten(array) {
  var res = [];
  var len = array.length;
  for (var i = 0; i < len; i++) {
    if (Array.isArray(array[i])) {
      res = res.concat(array[i]);
    } else {
      res.push(array[i]);
    }
  }
  return res;
}

function egal(a, b) {
  if (a === 0 && b === 0) {
    return 1 / a === 1 / b;
  } else if (a !== a) {
    return b !== b;
  } else {
    return a === b;
  }
}

function uniq(array, eq) {
  var result = [];
  var length = array.length;
  for (var i = 0; i < length; i++) {
    var value = array[i];
    var included = false;
    var length2 = result.length;

    for (var j = 0; j < length2; j++) {
      if (eq(value, result[j])) {
        included = true;
        break;
      }
    }

    if (!included) {
      result.push(value);
    }
  }
  return result;
}

module.exports = {
  flatten: flatten,
  egal: egal,
  uniq: uniq,
};
