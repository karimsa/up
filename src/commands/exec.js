/**
 * @file src/commands/exec.js
 * @copyright HireFast Inc. All rights reserved.
 */

import { child_process } from 'mz'

import { readEnv } from './env'
import { fetchServers } from './scale'
import * as config from '../config'
import { debug } from '../debug'

export async function exec({ target, argv }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	const servers = await fetchServers({ name, target })
	const env = await readEnv({ server: servers[0] })
	const command = argv._[1]
	const args = argv._.slice(2)

	debug(`Spawning command: %O`, {
		env,
		command,
	})
	await child_process.spawn(command, args, {
		env: { ...process.env, ...env },
		shell: true,
		stdio: 'inherit',
	})
}
