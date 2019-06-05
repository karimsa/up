"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;

var _prompts = _interopRequireDefault(require("prompts"));

var chalk = _interopRequireWildcard(require("chalk"));

var config = _interopRequireWildcard(require("../config"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file src/commands/login.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */
async function login() {
  const provider = config.getLocal('pkg.up.provider');

  switch (provider) {
    case 'digitalocean':
      if (config.getGlobal('auth.digitalocean.apiKey')) {
        console.log(`> User is already authenticated to: ${chalk.bold('digitalocean')}`);
        return;
      }

      const {
        apiKey
      } = await (0, _prompts.default)({
        type: 'password',
        name: 'apiKey',
        message: 'Please enter your DigitalOcean API key'
      });
      config.setGlobal('auth.digitalocean.apiKey', apiKey);
      return config.flush();

    case undefined:
      throw new Error(`Provider not specified in 'package.json'`);

    default:
      console.error(`Unknown provider: ${chalk.red(provider)}`);
      process.exit(1);
  }
}