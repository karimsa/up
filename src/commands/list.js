/**
 * @file src/commands/list.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'

import { fetchServers } from './scale'
import * as config from '../config'

export async function listServers({ target }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}
	if (!target) {
		throw new Error(`Please specify a valid target environment`)
	}

	for (const server of await fetchServers({ name, target })) {
		console.log(
			`> ${chalk.bold(server.name)} - ${chalk.green(server.status)} (${
				server.id
			} - ${server.addresses.public[0]})`,
		)
	}
}
