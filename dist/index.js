"use strict";

var _minimist = _interopRequireDefault(require("minimist"));

var _commands = require("./commands");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file src/index.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */
const argv = (0, _minimist.default)(process.argv.slice(2), {
  alias: {
    help: 'h',
    target: 't'
  },
  string: ['target'],
  boolean: ['help']
});
const command = argv._[0] || 'deploy';

function showUsage() {
  console.log('usage: up [command]');
  console.log('');
  console.log('Commands:');
  console.log('\tdeploy [default]\tdeploys your application');
  console.log('\tlogin\tlogs into your provider');
  console.log('');
  console.log('Options:');
  console.log('\t-t, --target [target]\tthe env you wish to deploy to');
  console.log('');
  process.exit(1);
}

if (argv.help) {
  showUsage();
}

async function main() {
  switch (command) {
    case 'deploy':
      return (0, _commands.deploy)({
        target: argv.target
      });

    case 'login':
      return (0, _commands.login)();

    default:
      console.error(`Unknown command: '${command}'`);
      showUsage();
  }
}

main().catch(err => {
  console.error(err.stack);
  process.exit(1);
});