"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _deploy = require("./deploy");

Object.keys(_deploy).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _deploy[key];
    }
  });
});

var _login = require("./login");

Object.keys(_login).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _login[key];
    }
  });
});