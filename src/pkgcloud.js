/**
 * @file src/pkgcloud.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import * as pkgcloud from 'pkgcloud'

import { getAuthentication } from './commands/login'

const compute = pkgcloud.compute.createClient(getAuthentication())

export function getServers(opts = {}) {
	return new Promise((resolve, reject) => {
		compute.getServers(opts, (err, servers) => {
			if (err) reject(err)
			else resolve(servers)
		})
	})
}

export function getServer(id) {
	return new Promise((resolve, reject) => {
		compute.getServer(id, (err, servers) => {
			if (err) reject(err)
			else resolve(servers)
		})
	})
}

export function createServer(opts) {
	return new Promise((resolve, reject) => {
		compute.createServer(opts, (err, server, res) => {
			if (err) reject(err)
			else if (res.statusCode > 399) reject(res.body)
			else resolve(server)
		})
	})
}

export function destroyServer(opts) {
	return new Promise((resolve, reject) => {
		compute.destroyServer(opts, (err, server, res) => {
			if (err) reject(err)
			else if (res.statusCode > 399) reject(res.body)
			else resolve(server)
		})
	})
}
