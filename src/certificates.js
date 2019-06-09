/**
 * @file src/certificates.js
 * @copyright HireFast Inc.. All rights reserved.
 */

import * as config from './config'
import { debug } from './debug'

const request = require('request-promise-native').defaults({
	baseUrl: 'https://api.digitalocean.com/v2/certificates',
	json: true,
	auth: {
		bearer: config.getGlobal('auth.digitalocean.apiKey'),
	},
})

export async function getCertificates({ domain }) {
	return (await request(`/`)).certificates.filter(cert => {
		return cert.dns_names.includes(domain)
	})
}

export async function createCertificate({ domain }) {
	const name = (function() {
		const d = domain.split('.').slice()
		if (d.length === 3) {
			d.shift()
		}
		return d.join('-')
	})()

	const body = {
		name,
		dns_names: [domain],
		type: 'lets_encrypt',
	}
	debug(`Certificate request => %O`, { body })
	return (await request.post(`/`, {
		body,
	})).certificate
}
