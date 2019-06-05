/**
 * @file src/debug.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

let isDebugEnabled = false
export function setDebug(enabled) {
	isDebugEnabled = enabled
}

export function debug(...msg) {
	if (isDebugEnabled) {
		process.stdout.write('[debug] ')
		console.log(...msg)
	}
}
