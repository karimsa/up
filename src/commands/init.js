/**
 * @file src/commands/init.js
 * @copyright 2019-present HireFast Inc. All rights reserved.
 */

import chalk from 'chalk'
import { dns, child_process } from 'mz'
import ansi from 'ansi-escapes'
import sleep from 'then-sleep'

import { initServer, fetchServers } from './scale'
import * as config from '../config'
import {
	createLBName,
	getLoadBalancer,
	createLoadBalancer,
} from '../loadbalancers'
import { debug } from '../debug'
import { getDomains, addDomain, getRecords, addRecord } from '../dns'

export async function init({ target, fqdn }) {
	const name = config.getLocal('pkg.name')
	if (!name) {
		throw new Error(`Project does not have a name`)
	}

	if (!target) {
		throw new Error(`Target environment is required`)
	}

	fqdn = String(fqdn || config.getLocal(`pkg.up.targets.${target}`)).split('.')
	if (fqdn.length === 1 && fqdn[0] === 'undefined') {
		throw new Error(`Failed to find domain target for ${target}`)
	}
	if (fqdn.length !== 3 && fqdn.length !== 2) {
		throw new Error(
			`Invalid FQDN: '${fqdn.join(
				'.',
			)}' (must be a domain or a domain with a single subdomain)`,
		)
	}
	const subdomain = fqdn.length === 3 ? fqdn.shift() : null
	const domain = fqdn.join('.')

	const servers = await fetchServers({ name, target })
	const server = await (function() {
		if (servers.length === 0) {
			console.log(`> Creating first server for: ${name}-${target}`)
			return initServer({
				name,
				target,
				instanceNumber: 1,
			})
		}
		return servers[0]
	})()

	const loadbalancer = await (async function() {
		const lb = await getLoadBalancer({ name, target })
		if (lb) {
			console.log(`> Found loadbalancer: ${chalk.bold(lb.name)}`)
			return lb
		}

		console.log(
			`> Creating loadbalancer: ${chalk.bold(
				createLBName({ name, target }),
			)} ...`,
		)
		return createLoadBalancer({
			name,
			target,
			droplet_ids: [server.id],
		})
	})()

	const domains = await getDomains()
	if (!domains.find(d => d.name === domain)) {
		console.log(`> Adding domain: ${chalk.green(domain)} ...`)
		await addDomain({ domain })
	} else {
		console.log(`> Found domain: ${chalk.bold(domain)}`)
	}

	const records = await getRecords({ domain })
	const record = records.find(r => r.name === subdomain)
	if (!record) {
		console.log(
			`> Setting up DNS for: ${chalk.green(
				subdomain + '.' + domain,
			)} -> ${chalk.green(loadbalancer.ip)}`,
		)

		await addRecord({
			type: 'A',
			domain,
			name: subdomain || '@',
			data: loadbalancer.ip,
		})
	} else {
		console.log(
			`> Found DNS entry: ${chalk.green(
				record.name + '.' + domain,
			)} -> ${chalk.green(record.data)}`,
		)
	}

	dns.setServers(['8.8.8.8', '8.8.4.4'])

	const targetHost = (subdomain ? subdomain + '.' : '') + domain
	try {
		await dns.lookup(targetHost)
	} catch (_) {
		console.log(
			`> Failed to resolve ${chalk.green(targetHost)}. Check the nameservers:`,
		)
		for (const ns of await dns.resolve(domain, 'NS')) {
			console.log(` - ${chalk.bold(ns)}`)
		}

		// pause till it works
		while (true) {
			process.stdout.write(`\r> Retrying ...${ansi.eraseEndLine}`)
			const [stdout, stderr] = await child_process.exec(
				`dig a +noall +answer @8.8.8.8 ${targetHost}`,
			)
			if (String(stdout).includes(loadbalancer.ip)) {
				break
			}

			debug(`No entry found in: %o`, {
				stdout: String(stdout),
				stderr: String(stderr),
			})

			for (let i = 0; i < 10; i++) {
				process.stdout.write(
					`\r> Failed. Retrying in ${10 - i}s ...${ansi.eraseEndLine}`,
				)
				await sleep(1000)
			}
		}
	}
	console.log(
		`\r> Resolved ${chalk.green(targetHost)} successfully${ansi.eraseEndLine}`,
	)

	return server
}
