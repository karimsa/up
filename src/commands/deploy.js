/**
 * @file src/commands/deploy.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import request from 'request-promise-native'
import chalk from 'chalk'
import _ from 'lodash'
import SSHClient from 'node-ssh'
import Bundler from 'parcel-bundler'
import * as path from 'path'
import { fs } from 'mz'
import * as tmp from 'tmp-promise'
import * as ansi from 'ansi-escapes'
import * as rimraf from 'rimraf'

import * as config from '../config'
import { debug } from '../debug'
import { getAuthentication } from './login'
import { execSsh, fetchServers, initServer } from './scale'

async function deployToServer({ server, dist }) {
	const ssh = new SSHClient()
	const [publicIP] = server.addresses.public
	await ssh.connect({
		host: publicIP,
		username: 'root',
		privateKey: path.resolve(process.env.HOME, '.ssh', 'id_rsa'),
	})

	const files = await fs.readdir(dist)
	if (files.length !== 1) {
		throw new Error(
			`Unsure how to deploy multiple entrypoints: ${files.join(', ')}`,
		)
	}
	const main = files[0]

	debug(`Uploading ${main} to ${server.name}`)
	await ssh.putFile(path.join(dist, main), `app/app.js`)
	await ssh.putFile(
		path.join(config.projectDirectory, 'package.json'),
		'app/package.json',
	)
	await ssh.putFile(
		path.join(config.projectDirectory, 'package-lock.json'),
		'app/package-lock.json',
	)

	debug(`Installing npm dependencies ...`)
	debug(
		await execSsh(ssh, `source ~/.nvm/nvm.sh && cd ~/app && npm i`, {
			env: {
				NODE_ENV: 'production',
			},
		}),
	)

	console.log(`> Restarting application server`)
	debug(
		await execSsh(
			ssh,
			'source ~/.nvm/nvm.sh && nvm use 10 && forever restart ~/app',
		),
	)

	await ssh.dispose()
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

	const name = config.getLocal('pkg.name')
	if (!name) {
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
					name,
					purpose:
						config.getLocal('pkg.description') ||
						`Deployment target for: ${name}`,
					environment: target,
				},
			})
		} catch (err) {
			if (_.get(err, 'error.id') !== 'conflict') {
				console.error(
					`> Failed to create project: '${chalk.bold(name)}' on digitalocean`,
				)
				throw err
			}
		}
	}

	// Bundle the entrypoint
	const main = config.getLocal('pkg.main') || 'index.js'
	process.stdout.write(`> Bundling: ${main} ...`)
	const dist = await tmp.dir()
	const startTime = Date.now()
	const bundler = new Bundler(path.resolve(config.projectDirectory, main), {
		target: 'node',
		bundleNodeModules: false,
		watch: false,
		outDir: dist.path,
		sourceMaps: false,
		logLevel: 2,
	})
	await bundler.bundle()
	console.log(
		`\r> Bundled in ${chalk.green(Date.now() - startTime + 'ms')}.${
			ansi.eraseEndLine
		}`,
	)

	// Grab current servers off digitalocean
	const servers = await fetchServers({ target, name })

	if (servers.length === 0) {
		console.log(`> No servers found running. Adding one ...`)
		servers.push(
			await initServer({
				name,
				target,
				instanceNumber: 1,
			}),
		)
	}

	// Deploy to all instances in parallel
	console.log(`> Deploying to:`)
	console.log(
		servers
			.map(
				server =>
					` - ${chalk.bold(server.name)} (${chalk.green(
						server.addresses.public[0],
					)})`,
			)
			.join('\n'),
	)
	await Promise.all(
		servers.map(server => deployToServer({ server, dist: dist.path })),
	)

	// Cleanup dist
	await rimraf.sync(dist.path)
}
