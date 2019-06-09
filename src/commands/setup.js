/**
 * @file src/commands/setup.js
 * @copyright HireFast Inc.. All rights reserved.
 */

import * as pkgcloud from '../pkgcloud'
import { setupServer } from './scale'

export async function setup({ id }) {
	const server = await pkgcloud.getServer(id)
	if (!server) {
		throw new Error(`Cannot find server with id: ${id}`)
	}
	return setupServer(server)
}
