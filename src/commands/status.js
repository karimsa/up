/**
 * @file src/commands/status.js
 * @copyright Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import request from 'request-promise-native'
import prettyTime from 'pretty-time'
import ms from 'ms'
import sleep from 'then-sleep'

import { fetchServers } from './scale'
import * as config from '../config'
import { debug } from '../debug'

export async function status({ target, interval }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}
	if (!target) {
		throw new Error(`Please specify a valid target environment`)
	}

	async function render() {
		debug('Fetching servers ...')
		const servers = await fetchServers({ name, target })
		debug('Servers => %O', servers)
		let output = ''

		output += `Number of servers: ${chalk.bold(servers.length)}\n`
		output += `\n`

		for (const server of servers) {
			output += ` - ${chalk.bold(server.name)} [${chalk.bold(
				server.id,
			)} - ${chalk.blue(server.status)}]:\n`
			const [publicIP] = server.addresses.public
			if (publicIP) {
				output += `\tIP: ${chalk.green(publicIP)}\n`
				try {
					debug(`Fetching status for ${publicIP}`)
					const { uptime, version, hash } = await request({
						url: `http://${publicIP}:81/`,
						json: true,
					})
					debug(`Grabbed status`)

					output += `\tUptime: ${chalk.green(prettyTime(uptime, 's'))}\n`
					output += `\tApp version: ${chalk.magenta(version)}\n`
					output += `\tBundle hash: ${chalk.cyan((hash || '').substr(0, 10))}\n`
				} catch (err) {
					output += `\tRejected status request: ${err.message}\n`
				}
			} else {
				output += `\tNo IP assigned yet. Current status: ${server.status}\n`
			}
			output += `\n`
		}

		if (interval) {
			console.clear()
		}
		process.stdout.write(output)
	}

	await render()
	if (interval) {
		while (true) {
			await sleep(ms(interval))
			await render()
		}
	}
}
