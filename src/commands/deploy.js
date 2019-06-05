/**
 * @file src/commands/deploy.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import request from 'request-promise-native'
import chalk from 'chalk'
import _ from 'lodash'

import * as config from '../config'
import { getAuthentication } from './login'
import * as pkgcloud from '../pkgcloud'

const createServerName = (name, num) =>
	`${name.replace(/^\@([a-zA-Z]+)\/([a-zA-Z\-_]+)$/, '$1-$2')}-${num}`

async function fetchServers({ client, projectName }) {
	const servers = []
	for (const server of await client.getServers()) {
		const matches = server.name.match(
			new RegExp(createServerName(projectName, '([0-9]+)')),
		)
		if (matches) {
			servers.push({
				instanceNumber: Number(matches[1]),
				server,
			})
		}
	}
	return servers
}

async function deployToServer({ server }) {
	const [publicIP] = server.addresses.public
	console.log(
		`> Deploying to: ${chalk.bold(server.name)} (${chalk.green(publicIP)})`,
	)
}

export async function deploy({ target }) {
	if (!target) {
		throw new Error(`No deployment target specified!`)
	}

	const provider =
		config.getLocal('pkg.up.provider') || config.getGlobal('defaultProvider')
	if (!provider) {
		throw new Error(`No provider specified`)
	}
	console.log(`> Provider set to: ${chalk.bold(provider)}`)

	const projectName = config.getLocal('pkg.name')
	if (!projectName) {
		throw new Error(`Project does not have a name`)
	}

	const pkgcloudAuth = getAuthentication()
	if (!pkgcloudAuth) {
		throw new Error(`User is not authenticated for: ${chalk.bold(provider)}`)
	}

	// For digitalocean, organize resources into a project
	if (provider === 'digitalocean') {
		try {
			await request.post('https://api.digitalocean.com/v2/projects', {
				auth: {
					bearer: config.getGlobal('auth.digitalocean.apiKey'),
				},
				json: true,
				body: {
					name: projectName,
					purpose:
						config.getLocal('pkg.description') ||
						`Deployment target for: ${projectName}`,
					environment: target,
				},
			})
		} catch (err) {
			if (_.get(err, 'error.id') !== 'conflict') {
				console.error(
					`> Failed to create project: '${chalk.bold(
						projectName,
					)}' on digitalocean`,
				)
				throw err
			}
		}
	}

	// Grab current servers off digitalocean
	const client = pkgcloud.init()
	const servers = await fetchServers({ client, projectName })

	if (servers.length === 0) {
		const name = createServerName(projectName, 1)
		console.log(
			`> No servers found running. Creating '${chalk.bold(name)}' ...`,
		)
		servers.push(
			await client.createServer({
				name,
				image: 'ubuntu-18-04-x64',
				flavor: 's-1vcpu-2gb',
				region: 'tor1',
				keyname: config.getLocal('keynames') || config.getGlobal('keynames'),
			}),
		)
	}

	// Deploy to all instances in parallel
	await Promise.all(servers.map(({ server }) => deployToServer({ server })))
}
