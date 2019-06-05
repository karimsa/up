/**
 * @file src/commands/login.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import prompts from 'prompts'
import * as chalk from 'chalk'

import * as config from '../config'

export async function login() {
	const provider = config.getLocal('pkg.up.provider')

	switch (provider) {
		case 'digitalocean':
			if (config.getGlobal('auth.digitalocean.apiKey')) {
				console.log(
					`> User is already authenticated to: ${chalk.bold('digitalocean')}`,
				)
				return
			}
			const { apiKey } = await prompts({
				type: 'password',
				name: 'apiKey',
				message: 'Please enter your DigitalOcean API key',
			})
			config.setGlobal('auth.digitalocean.apiKey', apiKey)
			return config.flush()

		case undefined:
			throw new Error(`Provider not specified in 'package.json'`)

		default:
			console.error(`Unknown provider: ${chalk.red(provider)}`)
			process.exit(1)
	}
}
