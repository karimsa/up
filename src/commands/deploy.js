/**
 * @file src/commands/deploy.js
 * @copyright 2019-present Karim Alibhai. All rights reserved.
 */

import * as pkgcloud from 'pkgcloud'

import { config } from '../config'

export function deploy({ target }) {
	if (!target) {
		throw new Error(`No deployment target specified!`)
	}

	console.warn({ config, target })
}
