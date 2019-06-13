/**
 * @file src/bootstrap.js
 * @copyright Karim Alibhai. All rights reserved.
 */

import 'dotenv/config'

import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import * as crypto from 'crypto'

import { version } from './package.json'

const startTime = process.hrtime()
const sha = crypto.createHash('sha1')
sha.update(fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8'))
const hash = sha.digest('hex')

const server = http.createServer((req, res) => {
    res.end(JSON.stringify({
        uptime: process.hrtime(startTime),
        version,
        hash,
    }))
})

server.listen(81, () => {
    console.log(`Status server started on :${server.address().port}`)
})

// load the app into the runtime now
import './app.js'
