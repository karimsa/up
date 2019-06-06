/**
 * @file src/commands/scale.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import _ from 'lodash'
import sleep from 'then-sleep'
import SSHClient from 'node-ssh'
import * as path from 'path'

import * as config from '../config'
import * as pkgcloud from '../pkgcloud'
import { debug } from '../debug'

export const createServerName = (name, target, num) =>
	`${name.replace(/^\@([a-zA-Z]+)\/([a-zA-Z\-_]+)$/, '$1-$2')}-${target}-${num}`

export async function execSsh(ssh, ...args) {
	const { code, stdout, stderr } = await ssh.execCommand(...args)
	debug({ args, stdout, stderr })
	if (code !== 0) {
		throw new Error(stderr)
	}
	return { stdout, stderr }
}

let serverList
export async function fetchServers({ name, target }) {
	if (!name || !target) {
		throw new Error(`'name' & 'target' are required parameters!`)
	}
	if (serverList) {
		return serverList
	}

	const servers = (serverList = [])
	for (const server of await pkgcloud.getServers()) {
		const matches = server.name.match(
			new RegExp(createServerName(name, target, '([0-9]+)')),
		)
		if (matches) {
			server.instanceNumber = Number(matches[1])
			servers.push(server)
		}
	}
	return servers
}

export async function initServer({ name, target, instanceNumber }) {
	const serverName = createServerName(name, target, instanceNumber)
	console.log(`> Creating server: ${chalk.bold(serverName)}`)
	const serverInfo = await pkgcloud.createServer({
		name: serverName,
		image: 'ubuntu-18-04-x64',
		flavor: 's-1vcpu-2gb',
		region: 'tor1',
		keyname: config.getLocal('keynames') || config.getGlobal('keynames'),
	})

	console.log(`> Waiting for server: ${chalk.bold(serverName)}`)
	while (true) {
		const server = await pkgcloud.getServer(serverInfo.id)
		const [publicIP] = server.addresses.public
		if (publicIP) {
			debug(
				`Identified server ${serverName} to have ip ${chalk.green(publicIP)}`,
			)
			serverInfo.addresses = server.addresses
			break
		}
		await sleep(1000)
	}

	const [publicIP] = serverInfo.addresses.public
	const client = new SSHClient()

	while (true) {
		try {
			await client.connect({
				host: publicIP,
				username: 'root',
				privateKey: path.resolve(process.env.HOME, '.ssh', 'id_rsa'),
			})
			break
		} catch (err) {
			debug(`Connection to ${serverName} failed: ${err.stack}`)
			await sleep(1000)
		}
	}

	debug(`Connected to server: ${serverName}`)
	debug(
		await execSsh(client, `apt-get install -yq git build-essential`, {
			env: {
				DEBIAN_FRONTEND: 'noninteractive',
			},
		}),
	)
	debug(
		await execSsh(
			client,
			'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash',
		),
	)
	debug(
		await execSsh(
			client,
			'source ~/.nvm/nvm.sh && nvm install 10 && nvm alias default 10 && npm install -g forever',
		),
	)
	debug(
		await execSsh(
			client,
			`mkdir -p ~/app && echo "const server = require('http').createServer((_, res) => res.end('Hello, world!')).listen(process.env.PORT, () => console.log('Listening :' + server.address().port))" > ~/app/app.js`,
		),
	)
	debug(
		await execSsh(
			client,
			`echo "require('dotenv/config'),require('./app')" > ~/app/index.js`,
		),
	)
	debug(
		await execSsh(
			client,
			`echo 'NODE_ENV=production' > ~/app/.env && echo 'PORT=80' >> ~/app/.env`,
		),
	)
	debug(
		await client.putFile(path.resolve(process.env.HOME, '.npmrc'), '.npmrc'),
	)
	debug(
		await execSsh(client, 'cd ~/app && source ~/.nvm/nvm.sh && npm i dotenv'),
	)
	debug(
		await execSsh(
			client,
			'source ~/.nvm/nvm.sh && forever stopall && forever start --minUptime 5000 --spinSleepTime 1000 --workingDir ~/app ~/app',
		),
	)

	// UFW config
	debug(
		await execSsh(
			client,
			`ufw allow 80 && ufw allow OpenSSH && yes | ufw enable`,
		),
	)

	debug(`Disconnecting from server: ${serverName}`)
	await client.dispose()
}

export async function scale({ action, size, target }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	const servers = await fetchServers({ name, target })

	if (!action) {
		if (size > servers.length) {
			size = size - servers.length
			action = 'up'
		} else if (size < servers.length) {
			size = servers.length - size
			action = 'down'
		} else {
			console.log(
				`> There are already ${chalk.bold(size)} servers running ${chalk.bold(
					name,
				)}`,
			)
			return
		}
	}
	if (size === 0) {
		console.log(`! Cannot scale ${action} by 0 servers.`)
		return
	}

	// Verify direction
	if (action !== 'up' && action !== 'down') {
		throw new Error(`Unknown scaling direction: ${action}`)
	}

	console.log(
		`> Scaling service ${chalk.bold((action === 'up' ? '+' : '-') + size)}`,
	)

	// scale up
	if (action === 'up') {
		const goals = []
		for (let i = servers.length; i < servers.length + size; i++) {
			goals.push(initServer({ name, target, instanceNumber: i }))
		}
		await Promise.all(goals)
	}

	// scale down
	else {
		const goals = []
		for (let i = 0; i < size; i++) {
			console.log(
				`> Deleting server: ${chalk.red(servers[i].name)} (${servers[i].name})`,
			)
			goals.push(pkgcloud.destroyServer(servers[i].id))
		}
		await Promise.all(goals)
	}
}
