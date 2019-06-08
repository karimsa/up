/**
 * @file src/index.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import minimist from 'minimist'
import chalk from 'chalk'

import { setDebug, debug } from './debug'
import {
	deploy,
	login,
	logout,
	scale,
	listServers,
	logs,
	env,
	restart,
	init,
} from './commands'

const argv = minimist(process.argv.slice(2), {
	alias: {
		help: 'h',
		target: 't',
		verbose: 'v',
		follow: 'f',
		all: 'a',
	},

	string: ['target'],
	boolean: ['help', 'verbose', 'follow', 'all'],
})
const command = argv._[0] || 'deploy'

function showUsage() {
	console.log('usage: up [command]')
	console.log('')
	console.log('Commands:')
	console.log('\tdeploy\tdeploys your application')
	console.log('\tlogin\tlogs into your provider')
	console.log('\tlogout\tlogs out of your provider')
	console.log('\tscale [size]\tscales a service up or down')
	console.log('')
	console.log('Options:')
	console.log('\t-t, --target [target]\tthe env you wish to deploy to')
	console.log('\t-v, --verbose\tenable verbose logging')
	console.log('\t-f, --follow\ttail the logs')
	console.log('')
	process.exit(1)
}

if (argv.help) {
	showUsage()
}

const target = argv.target || process.env.ENV_TARGET || 'development'
if (!['development', 'staging', 'production'].includes(target)) {
	console.error(`! Invalid target environment: '${target}'`)
	showUsage()
}

async function main() {
	setDebug(argv.verbose)

	switch (command) {
		case 'deploy':
			return deploy({ target })

		case 'login':
			return login()

		case 'logout':
			return logout()

		case 'scale':
			let action
			let size = argv._[1]
			if (!size) {
				console.error(`! Size is a required argument.`)
				showUsage()
			}
			size = size.substr(1)

			if (size[0] === '+') {
				action = 'up'
				size = Number(size.substr(1))
			} else if (size[0] === '-') {
				action = 'down'
				size = Number(size.substr(1))
			} else {
				size = Number(size)
			}

			if (isNaN(size)) {
				console.error(
					`Please provide a valid size for your service, not '${chalk.red(
						argv._[1],
					)}'`,
				)
				showUsage()
			}
			return scale({ action, size, target })

		case 'ls':
		case 'list':
			return listServers({ target })

		case 'logs':
			return logs({ target, follow: argv.follow })

		case 'e':
		case 'env':
			return env({ target, argv })

		case 'r':
		case 'restart':
			return restart({ target })

		case 'i':
		case 'init':
			return init({ target, fqdn: argv._[1] })

		default:
			console.error(`Unknown command: '${command}'`)
			showUsage()
	}
}

main().catch(err => {
	if (err.message) {
		console.error(`${chalk.red('x')} ${err.message}`)
		if (err.stack) {
			debug(err.stack)
		}
	} else {
		console.error(`${chalk.red('x')} ${err}`)
	}
	process.exit(1)
})
