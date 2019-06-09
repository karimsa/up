/**
 * @file src/commands/logs.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import SSHClient from 'node-ssh'
import * as path from 'path'

import { fetchServers } from './scale'
import * as config from '../config'
import { debug } from '../debug'

async function showLogsFrom({ server, publicIP, follow }) {
	const ssh = new SSHClient()
	await ssh.connect({
		host: publicIP,
		username: 'root',
		privateKey: config.getValue('keynames'),
	})

	debug(
		await ssh.execCommand(
			`source ~/.nvm/nvm.sh && forever logs 0` + (follow ? ' -f' : ''),
			{
				stream: 'both',
				onStdout: chunk =>
					console.log(
						`[${chalk.bold(server.instanceNumber)}] ${String(chunk).trim()}`,
					),
				onStderr: chunk =>
					console.error(
						`! [${chalk.red(server.instanceNumber)}] ${String(chunk).trim()}`,
					),
			},
		),
	)
	await ssh.dispose()
}

export async function logs({ target, follow }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	const goals = []

	const servers = await fetchServers({ name, target })
	if (servers.length === 0) {
		throw new Error(`No servers are deployed for this service`)
	}

	for (const server of servers) {
		const [publicIP] = server.addresses.public
		debug(`> Found ${server.name} @ ${publicIP}`)
		goals.push(
			showLogsFrom({
				server,
				publicIP,
				follow,
			}),
		)
	}

	await Promise.all(goals)
}
