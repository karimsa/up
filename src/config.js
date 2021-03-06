/**
 * @file src/config.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import rc from 'rc'
import { fs } from 'mz'
import * as path from 'path'
import _ from 'lodash'

import { debug } from './debug'

function loadConfig(projectDirectory = process.cwd()) {
	if (projectDirectory === '/') {
		throw new Error(`Failed to find a 'package.json'`)
	}

	try {
		const pkg = require(path.join(projectDirectory, 'package.json'))
		return {
			projectDirectory,
			pkg: {
				main: 'index.js',
				...pkg,
			},
		}
	} catch (_) {
		return loadConfig(path.dirname(projectDirectory))
	}
}

const localConfig = loadConfig()
const globalConfig = rc('up')

export const projectDirectory = localConfig.projectDirectory
debug(
	`> Located project directory: ${projectDirectory.replace(
		process.env.HOME,
		'~',
	)}`,
)

export function getLocal(key) {
	return _.get(localConfig, key)
}

export function getValue(key) {
	const value = getLocal(`pkg.up.${key}`) || getGlobal(key)
	debug(`Read config %O => %O`, key, value)
	return value
}

export function getGlobal(key) {
	if (key === 'defaultProvider') {
		return 'digitalocean'
	}
	if (key === 'keyPath') {
		if (process.env.UP_SSH_KEY) {
			return process.env.UP_SSH_KEY
		}

		const pathToKey = path.resolve(process.env.HOME, '.ssh', 'id_rsa')
		if (fs.existsSync(pathToKey)) {
			return pathToKey
		}
	}
	return _.get(globalConfig, key)
}

export function setLocal(key, value) {
	_.set(localConfig, key, value)
}

export function setGlobal(key, value) {
	_.set(globalConfig, key, value)
}

export async function flush() {
	const localConfigPath = path.join(
		localConfig.projectDirectory,
		'package.json',
	)
	const globalConfigPath =
		globalConfig.config || path.join(process.env.HOME, '.uprc')

	debug(`Writing local config: ${localConfigPath}`)
	debug(`Writing global config: ${globalConfig.config}`)

	return Promise.all([
		fs.writeFile(localConfigPath, JSON.stringify(localConfig.pkg, null, 2)),
		fs.writeFile(globalConfigPath, JSON.stringify(globalConfig, null, '\t')),
	])
}
