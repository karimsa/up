/**
 * @file src/config.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import rc from 'rc'
import { fs } from 'mz'
import * as path from 'path'
import _ from 'lodash'

function loadConfig(projectDirectory = process.cwd()) {
	if (projectDirectory === '/') {
		throw new Error(`Failed to find a 'package.json'`)
	}

	try {
		const pkg = require(path.join(projectDirectory, 'package.json'))
		console.log(
			`> Located project directory: ${projectDirectory.replace(
				process.env.HOME,
				'~',
			)}`,
		)
		return {
			projectDirectory,
			pkg: {
				...pkg,

				main: 'index.js',
				up: {
					...(pkg.up || {}),

					provider: 'digitalocean',
				},
			},
		}
	} catch (_) {
		return loadConfig(path.dirname(projectDirectory))
	}
}

const localConfig = loadConfig()
const globalConfig = rc('up')

export const projectDirectory = localConfig.projectDirectory

export function getLocal(key) {
	return _.get(localConfig, key)
}

export function getGlobal(key) {
	return _.get(globalConfig, key)
}

export function setLocal(key, value) {
	_.set(key, value, localConfig)
}

export function setGlobal(key, value) {
	_.set(key, value, globalConfig)
}

export async function flush() {
	const localConfigPath = path.join(
		localConfig.projectDirectory,
		'package.json',
	)
	console.log(`Writing local config: ${localConfigPath}`)
	console.log(`Writing global config: ${globalConfig.config}`)

	return Promise.all([
		fs.writeFile(localConfigPath, JSON.stringify(localConfig.pkg, null, 2)),
		fs.writeFile(globalConfig.config, JSON.stringify(globalConfig, null, '\t')),
	])
}
