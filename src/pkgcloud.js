/**
 * @file src/pkgcloud.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import * as pkgcloud from 'pkgcloud'

import { getAuthentication } from './commands/login'

const auth = getAuthentication()
const compute = auth && pkgcloud.compute.createClient(auth)

export function getServers(opts = {}) {
	if (!auth) {
		throw new Error(`User is not authenticated for provider!`)
	}

	return new Promise((resolve, reject) => {
		compute.getServers(opts, (err, servers) => {
			if (err) reject(err)
			else resolve(servers)
		})
	})
}

export function getServer(id) {
	if (!auth) {
		throw new Error(`User is not authenticated for provider!`)
	}

	return new Promise((resolve, reject) => {
		compute.getServer(id, (err, servers) => {
			if (err) reject(err)
			else resolve(servers)
		})
	})
}

export function createServer(opts) {
	if (!auth) {
		throw new Error(`User is not authenticated for provider!`)
	}

	return new Promise((resolve, reject) => {
		compute.createServer(opts, (err, server, res) => {
			if (err) reject(err)
			else if (res.statusCode > 399) reject(res.body)
			else resolve(server)
		})
	})
}

export function destroyServer(opts) {
	if (!auth) {
		throw new Error(`User is not authenticated for provider!`)
	}

	return new Promise((resolve, reject) => {
		compute.destroyServer(opts, (err, server, res) => {
			if (err) reject(err)
			else if (res.statusCode > 399) reject(res.body)
			else resolve(server)
		})
	})
}
