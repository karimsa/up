/**
 * @file src/dns.js
 * @copyright 2019-present HireFast Inc. All rights reserved.
 */

import * as config from './config'

const request = require('request-promise-native').defaults({
	baseUrl: 'https://api.digitalocean.com/v2',
	json: true,
	auth: {
		bearer: config.getGlobal('auth.digitalocean.apiKey'),
	},
})

export async function getDomains() {
	return (await request(`/domains`)).domains
}

export function addDomain({ domain }) {
	return request.post(`/domains`, {
		body: { name: domain },
	})
}

export async function getRecords({ domain }) {
	return (await request(`/domains/${domain}/records`)).domain_records
}

export function addRecord({ domain, name, data, type }) {
	return request.post(`/domains/${domain}/records`, {
		body: {
			type,
			name,
			data,
		},
	})
}
