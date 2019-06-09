/**
 * @file src/commands/login.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import prompts from 'prompts'
import chalk from 'chalk'

import * as config from '../config'

export function getAuthentication() {
	const provider =
		config.getLocal('pkg.up.provider') || config.getGlobal('defaultProvider')
	switch (provider) {
		case 'digitalocean':
			const token =
				config.getGlobal('auth.digitalocean.apiKey') || process.env.DO_TOKEN
			if (token) {
				return { provider, token }
			}
			return

		case undefined:
			throw new Error(`Provider not specified in 'package.json'`)

		default:
			console.error(`Unknown provider: ${chalk.red(provider)}`)
			process.exit(1)
	}
}

export async function login() {
	const provider = config.getLocal('pkg.up.provider')

	switch (provider) {
		case 'digitalocean':
			if (config.getGlobal('auth.digitalocean.apiKey')) {
				console.log(
					`> User is already authenticated for ${chalk.bold('digitalocean')}`,
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

export function logout() {
	const provider = config.getLocal('pkg.up.provider')

	switch (provider) {
		case 'digitalocean':
			if (!config.getGlobal('auth.digitalocean.apiKey')) {
				console.log(
					`> User is not authenticated for ${chalk.bold('digitalocean')}`,
				)
			} else {
				console.log(`> Logging user out of ${chalk.bold('digitalocean')}`)
			}
			config.setGlobal('auth.digitalocean.apiKey', null)
			return config.flush()

		case undefined:
			throw new Error(`Provider not specified in 'package.json'`)

		default:
			console.error(`Unknown provider: ${chalk.red(provider)}`)
			process.exit(1)
	}
}
