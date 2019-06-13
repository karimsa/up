/**
 * @file src/commands/status.js
 * @copyright Karim Alibhai. All rights reserved.
 */

import chalk from 'chalk'
import request from 'request-promise-native'
import prettyTime from 'pretty-time'

import { fetchServers } from './scale'
import * as config from '../config'

export async function status({ target }) {
    const name = config.getLocal('pkg.name')
    if (!name) {
        throw new Error(`Project does not have a name`)
    }
    if (!target) {
        throw new Error(`Please specify a valid target environment`)
    }

    const servers = await fetchServers({ name, target })

    console.log(`Number of servers: ${chalk.bold(servers.length)}`)
    console.log(``)

    for (const server of servers) {
        console.log(` - ${chalk.bold(server.name)} [${chalk.bold(server.id)}]:`)
        const [publicIP] = server.addresses.public
        if (publicIP) {
            console.log(`\tIP: ${chalk.green(publicIP)}`)
            try {
                const { uptime, version, hash } = await request({
                    url: `http://${publicIP}:81/`,
                    json: true
                })

                console.log(`\tUptime: ${chalk.green(prettyTime(uptime, 's'))}`)
                console.log(`\tApp version: ${chalk.magenta(version)}`)
                console.log(`\tBundle hash: ${chalk.cyan((hash || '').substr(0, 10))}`)
            } catch (err) {
                console.log(`\tRejected status request: ${err.message}`)
            }
        } else {
            console.log(`\tNo IP assigned yet. Current status: ${server.status}`)
        }
        console.log(``)
    }
}
