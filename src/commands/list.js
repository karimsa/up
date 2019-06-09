/**
 * @file src/commands/list.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'

import { fetchServers } from './scale'
import * as config from '../config'
import { getLoadBalancer } from '../loadbalancers'
import { getSSHKeys } from '../ssh-keys'

export async function listServers({ target }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}
	if (!target) {
		throw new Error(`Please specify a valid target environment`)
	}

	console.log(`> SSH Keys:`)
	const keynames = config.getValue('keynames')
	for (const sshKey of await getSSHKeys()) {
		if (sshKey.name.startsWith('up-cli')) {
			if (
				keynames.includes(sshKey.id) ||
				keynames.includes(sshKey.fingerprint)
			) {
				console.log(
					` - ${chalk.bold(sshKey.name)} (${chalk.green(
						sshKey.id,
					)}) (${chalk.green('active')})`,
				)
			} else {
				console.log(` - ${chalk.bold(sshKey.name)} (${chalk.green(sshKey.id)})`)
			}
		}
	}
	console.log()

	console.log(`> Application servers:`)
	for (const server of await fetchServers({ name, target })) {
		console.log(
			` - ${chalk.bold(server.name)} - ${chalk.green(server.status)} (${
				server.id
			} - ${server.addresses.public[0]})`,
		)
	}

	console.log()
	const loadbalancer = await getLoadBalancer({ name, target })
	if (loadbalancer) {
		console.log(`> Load balancer:`)
		console.log(
			` - ${chalk.bold(loadbalancer.name)} - ${chalk.green(
				loadbalancer.status,
			)} (${loadbalancer.ip})`,
		)
	} else {
		console.log(`> No load balancers found.`)
	}
}
