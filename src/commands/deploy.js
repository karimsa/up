/**
 * @file src/commands/deploy.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import _ from 'lodash'
import Bundler from 'parcel-bundler'
import * as path from 'path'
import { fs, child_process } from 'mz'
import * as tmp from 'tmp-promise'
import * as ansi from 'ansi-escapes'
import * as rimraf from 'rimraf'

import * as config from '../config'
import { debug } from '../debug'
import { getAuthentication } from './login'
import { execSsh, fetchServers, connectServer } from './scale'
import { init } from './init'

async function deployToServer({ server, dist }) {
	const ssh = await connectServer(server)

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

export async function deploy({ target, skipBuild }) {
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

	if (!getAuthentication()) {
		throw new Error(`User is not authenticated for: ${chalk.bold(provider)}`)
	}

	// Add `.cache` for parcel to `.gitignore
	try {
		const gitignore = (await fs.readFile(
			path.resolve(config.projectDirectory, '.gitignore'),
			'utf8',
		)).split(/\r?\n/g)
		if (!gitignore.includes('/.cache')) {
			gitignore.push('/.cache')
			await fs.writeFile(
				path.resolve(config.projectDirectory, '.gitignore'),
				gitignore.join('\r\n') + '\r\n',
			)
		}
	} catch (err) {
		if (!String(err).includes('ENOENT')) {
			throw err
		}
	}

	// Run build step if one exists
	if (!skipBuild && config.getLocal('pkg.scripts.build')) {
		process.stdout.write(`> Running 'npm run build' ...`)
		const buildStart = Date.now()
		const [stdout, stderr] = await child_process.exec('npm run build', {
			env: process.env,
			cwd: config.projectDirectory,
		})
		debug(`'npm run build' => %O`, { stdout, stderr })
		console.log(
			`\r> Ran 'npm run build' in ${chalk.green(
				Date.now() - buildStart + 'ms',
			)}.${ansi.eraseEndLine}`,
		)
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
		servers.push(await init({ target }))
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
