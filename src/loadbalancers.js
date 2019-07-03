/**
 * @file src/loadbalancers.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'

import * as config from './config'
import { debug } from './debug'
import { fetchServers } from './commands/scale'

export const createLBName = ({ name, target }) =>
	`${name.replace(/^\@([a-zA-Z]+)\/([a-zA-Z\-_]+)$/, '$1-$2')}-${target}`

const request = require('request-promise-native').defaults({
	baseUrl: 'https://api.digitalocean.com/v2/load_balancers',
	json: true,
	auth: {
		bearer: config.getGlobal('auth.digitalocean.apiKey'),
	},
})

export async function addDropletToBalancer({ name, target, droplet }) {
	const load_balancer = await getLoadBalancer({ name, target })
	await request.put(`/${load_balancer.id}`, {
		body: {
			droplet_ids: load_balancer.droplet_ids.concat([droplet]),
		},
	})
}

export async function removeDropletFromBalancer({ name, target, droplet }) {
	const load_balancer = await getLoadBalancer({ name, target })
	await request.put(`/${load_balancer.id}`, {
		body: {
			droplet_ids: load_balancer.droplet_ids.filter(id => id !== droplet),
		},
	})
}

export async function syncLoadBalancer({ name, target }) {
	const load_balancer = await getLoadBalancer({ name, target })
	console.log(
		`> Found loadbalancer for ${chalk.bold(name)}: ${chalk.green(
			load_balancer.name,
		)}`,
	)
	const droplet_ids = (await fetchServers({ name, target })).map(s => s.id)

	const strLBIds = JSON.stringify(load_balancer.droplet_ids.sort())
	const strDropletIds = JSON.stringify(droplet_ids.sort())

	console.log(` - Loadbalancer instances: ${chalk.green(strLBIds)}`)
	console.log(` - Droplets: ${chalk.red(strDropletIds)}`)

	if (strLBIds !== strDropletIds) {
		console.log(`> Loadbalancer is out of sync. Updating ...`)
		load_balancer.droplet_ids = droplet_ids
		await request.put(`/${load_balancer.id}`, {
			body: {
				name: load_balancer.name,
				droplet_ids,
			},
		})
	}
}

export async function createLoadBalancer({
	name,
	target,
	algorithm,
	droplet_ids,
	certificate_id,
}) {
	const body = {
		name: createLBName({ name, target }),
		algorithm: algorithm || 'least_connections',
		region: config.getLocal('region') || config.getGlobal('region') || 'tor1',
		redirect_http_to_https: true,
		forwarding_rules: [
			{
				entry_protocol: 'https',
				entry_port: 443,
				target_protocol: 'http',
				target_port: 80,
				certificate_id,
			},
			{
				entry_protocol: 'http',
				entry_port: 80,
				target_protocol: 'http',
				target_port: 80,
			},
		],
		health_check: {
			protocol: 'tcp',
			port: 80,
		},
		droplet_ids,
	}
	debug(`Loadbalancer args => %O`, body)
	const res = await request.post('/', {
		body,
	})
	return res.load_balancer
}

export async function getLoadBalancer({ name, target }) {
	const { load_balancers } = await request('/')
	const lbname = createLBName({ name, target })
	return load_balancers.find(lb => {
		return lb.name === lbname
	})
}
