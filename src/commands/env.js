/**
 * @file src/commands/env.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import dotenv from 'dotenv'

import * as config from '../config'
import { execSsh, fetchServers, connectServer } from './scale'

export async function readEnv({ server }) {
	const ssh = await connectServer(server)

	const { stdout } = await execSsh(ssh, 'cat ~/app/.env')
	const env = dotenv.parse(stdout)
	await ssh.dispose()
	return env
}

async function putEnv({ server, env }) {
	const ssh = await connectServer(server)

	await ssh.execCommand('echo > ~/app/.env')
	for (const key of Object.keys(env)) {
		await ssh.execCommand(`echo '${key}=${env[key]}' >> ~/app/.env`)
	}
	await ssh.dispose()
}

export async function env({ argv, target }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	const servers = await fetchServers({ name, target })
	const key = argv._[1]
	const value = argv._[2]
	const action = argv._.length === 3 ? 'set' : 'get'
	const all = argv.all

	if (action === 'set') {
		for (const server of servers) {
			const env = await readEnv({ server })
			env[key] = value
			await putEnv({ server, env })
		}
	} else if (action === 'get' && all) {
		for (const server of servers) {
			const env = await readEnv({ server })
			console.log(`\t[${chalk.bold(server.name)}] %O => %O`, key, env[key])
		}
	} else if (!key && all) {
		for (const server of servers) {
			console.log(`${server.name}:`)

			const env = await readEnv({ server })
			for (const key of Object.keys(env)) {
				console.log(`\t${key} => %O`, env[key])
			}
		}
	} else if (!key) {
		const env = await readEnv({ server: servers[0] })
		for (const key of Object.keys(env)) {
			console.log(`\t${key} => %O`, env[key])
		}
	} else if (action === 'get') {
		const env = await readEnv({ server: servers[0] })
		console.log(`\t%O => %O`, key, env[key])
	} else {
		throw new Error(`Unknown action: '${key}'`)
	}
}
