/**
 * @file src/index.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import minimist from 'minimist'

import { setDebug } from './debug'
import { deploy, login, logout } from './commands'

const argv = minimist(process.argv.slice(2), {
	alias: {
		help: 'h',
		target: 't',
		verbose: 'v',
	},

	string: ['target'],
	boolean: ['help', 'verbose'],
})
const command = argv._[0] || 'deploy'

function showUsage() {
	console.log('usage: up [command]')
	console.log('')
	console.log('Commands:')
	console.log('\tdeploy [default]\tdeploys your application')
	console.log('\tlogin\tlogs into your provider')
	console.log('\tlogout\tlogs out of your provider')
	console.log('')
	console.log('Options:')
	console.log('\t-t, --target [target]\tthe env you wish to deploy to')
	console.log('\t-v, --verbose\tenable verbose logging')
	console.log('')
	process.exit(1)
}

if (argv.help) {
	showUsage()
}

async function main() {
	setDebug(argv.verbose)

	switch (command) {
		case 'deploy':
			return deploy({ target: argv.target })

		case 'login':
			return login()

		case 'logout':
			return logout()

		default:
			console.error(`Unknown command: '${command}'`)
			showUsage()
	}
}

main().catch(err => {
	console.error(err.stack)
	process.exit(1)
})
