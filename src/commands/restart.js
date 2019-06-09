/**
 * @file src/commands/restart.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import * as path from 'path'
import SSHClient from 'node-ssh'

import { fetchServers, execSsh } from './scale'
import * as config from '../config'
import { debug } from '../debug'

export async function restart({ target }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	return Promise.all(
		(await fetchServers({ name, target })).map(server => {
			const ssh = new SSHClient()
			console.log(
				`> Restarting application server on: ${chalk.bold(server.name)}`,
			)
			return ssh
				.connect({
					host: server.addresses.public[0],
					username: 'root',
					privateKey: config.getValue('keynames'),
				})
				.then(() => execSsh(ssh, `source ~/.nvm/nvm.sh && forever restart 0`))
				.then(res => debug(res))
				.then(() => ssh.dispose())
		}),
	)
}
