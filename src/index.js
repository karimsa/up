/**
 * @file src/index.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import minimist from 'minimist'

import { deploy, login } from './commands'

const argv = minimist(process.argv.slice(2), {
	alias: {
		help: 'h',
		target: 't',
	},

	string: ['target'],
	boolean: ['help'],
})
const command = argv._[0] || 'deploy'

function showUsage() {
	console.log('usage: up [command]')
	console.log('')
	console.log('Commands:')
	console.log('\tdeploy [default]\tdeploys your application')
	console.log('\tlogin\tlogs into your provider')
	console.log('')
	console.log('Options:')
	console.log('\t-t, --target [target]\tthe env you wish to deploy to')
	console.log('')
	process.exit(1)
}

if (argv.help) {
	showUsage()
}

async function main() {
	switch (command) {
		case 'deploy':
			return deploy({ target: argv.target })

		case 'login':
			return login()

		default:
			console.error(`Unknown command: '${command}'`)
			showUsage()
	}
}

main().catch(err => {
	console.error(err.stack)
	process.exit(1)
})
