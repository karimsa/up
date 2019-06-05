/**
 * @file src/debug.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'

let isDebugEnabled = false
export function setDebug(enabled) {
	isDebugEnabled = enabled
}

export function debug(...msg) {
	if (isDebugEnabled) {
		process.stdout.write(`[${chalk.yellow('debug')}] `)
		console.log(...msg)
	}
}
