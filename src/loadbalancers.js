/**
 * @file src/loadbalancers.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import * as config from './config'

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

export async function createLoadBalancer({
	name,
	target,
	algorithm,
	droplet_ids,
}) {
	await request.post('/', {
		body: {
			name: createLBName({ name, target }),
			algorithm: algorithm || 'least_connections',
			region: config.getLocal('region') || config.getGlobal('region') || 'tor1',
			redirect_http_to_https: true,
			forwarding_rules: [
				{
					entry_protocol: 'https',
					entry_port: 444,
					target_protocol: 'https',
					target_port: 443,
					tls_passthrough: true,
				},
			],
			droplet_ids,
		},
	})
}

export async function getLoadBalancer({ name, target }) {
	const { load_balancers } = await request('/')
	const lbname = createLBName({ name, target })
	return load_balancers.find(lb => {
		return lb.name === lbname
	})
}
