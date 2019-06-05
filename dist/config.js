"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocal = getLocal;
exports.getGlobal = getGlobal;
exports.setLocal = setLocal;
exports.setGlobal = setGlobal;
exports.flush = flush;
exports.projectDirectory = void 0;

var _rc = _interopRequireDefault(require("rc"));

var _mz = require("mz");

var path = _interopRequireWildcard(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file src/config.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */
function loadConfig(projectDirectory = process.cwd()) {
  if (projectDirectory === '/') {
    throw new Error(`Failed to find a 'package.json'`);
  }

  try {
    const pkg = require(path.join(projectDirectory, 'package.json'));

    console.log(`> Located project directory: ${projectDirectory.replace(process.env.HOME, '~')}`);
    return {
      projectDirectory,
      pkg: { ...pkg,
        main: 'index.js',
        up: { ...(pkg.up || {}),
          provider: 'digitalocean'
        }
      }
    };
  } catch (_) {
    return loadConfig(path.dirname(projectDirectory));
  }
}

const localConfig = loadConfig();
const globalConfig = (0, _rc.default)('up');
const projectDirectory = localConfig.projectDirectory;
exports.projectDirectory = projectDirectory;

function getLocal(key) {
  return _lodash.default.get(localConfig, key);
}

function getGlobal(key) {
  return _lodash.default.get(globalConfig, key);
}

function setLocal(key, value) {
  _lodash.default.set(key, value, localConfig);
}

function setGlobal(key, value) {
  _lodash.default.set(key, value, globalConfig);
}

function flush() {
  return Promise.all([_mz.fs.writeFile(path.join(localConfig.projectDirectory, 'package.json'), JSON.stringify(localConfig.pkg, null, 2)), _mz.fs.writeFile(globalConfig.config, JSON.stringify(globalConfig, null, '\t'))]);
}