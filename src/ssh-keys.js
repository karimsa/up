/**
 * @file src/ssh-keys.js
 * @copyright HireFast Inc.. All rights reserved.
 */

import * as config from './config'

const request = require('request-promise-native').defaults({
	baseUrl: 'https://api.digitalocean.com/v2/account/keys',
	json: true,
	auth: {
		bearer: config.getGlobal('auth.digitalocean.apiKey'),
	},
})

export async function getSSHKeys() {
	return (await request('/')).ssh_keys
}

export async function createSSHKey({ name, key }) {
	return (await request.post(`/`, {
		body: {
			name,
			public_key: key,
		},
	})).ssh_key
}
