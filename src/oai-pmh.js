import { assign, get } from 'lodash'
import request from 'request'
import { promisify } from 'util'

import pkg from '../package.json'
import { OaiPmhError } from './errors'
import { getOaiListItems } from './oai-pmh-list'
import { parseOaiPmhXml } from './oai-pmh-xml'
import { sleep } from './utils'

// main class
export class OaiPmh {
  constructor (baseUrl, _options = {}) {
    this.baseUrl = baseUrl

    // default options
    this.options = {
      userAgent: `oai-pmh/${pkg.version} (${pkg.homepage})`,
      retry: true, // automatically retry in case of status code 503
      retryMin: 5, // wait at least 5 seconds
      retryMax: 600 // wait at maximum 600 seconds
    }
    // set user-provided options
    assign(this.options, _options)
  }

  // OAI-PMH request with retries for status code 503
  async request (options) {
    let res

    // loop until request succeeds (with retry: true)
    do {
      res = await promisify(request)({
        ...options,
        headers: {
          ...(options.headers || {}),
          'User-Agent': this.options.userAgent
        }
      })

      // retry?
      if (res.statusCode === 503 && this.options.retry) {
        // get and parse retry-after header
        const retryAfter = res.headers['retry-after']

        if (!retryAfter) {
          throw new OaiPmhError('Status code 503 without Retry-After header.')
        }

        // compute seconds to wait
        let retrySeconds
        if (/^\s*\d+\s*$/.test(retryAfter)) {
          // integer: seconds to wait
          retrySeconds = parseInt(retryAfter, 10)
        } else {
          // http-date: date to await
          const retryDate = new Date(retryAfter)
          if (!retryDate) {
            throw new OaiPmhError('Status code 503 with invalid Retry-After header.')
          }
          retrySeconds = Math.floor((retryDate - new Date()) / 1000)
        }

        // sanitize
        if (retrySeconds < this.options.retryMin) {
          retrySeconds = this.options.retryMin
        }
        if (retrySeconds > this.options.retryMax) {
          retrySeconds = this.options.retryMax
        }

        // wait
        await sleep(retrySeconds)
      }
    } while (res.statusCode === 503 && this.options.retry)

    if (res.statusCode !== 200) {
      throw new OaiPmhError(
        `Unexpected status code ${res.statusCode} (expected 200).`
      )
    }

    return res
  }

  async getRecord (identifier, metadataPrefix) {
    // send request
    const res = await this.request({
      url: this.baseUrl,
      qs: {
        verb: 'GetRecord',
        identifier,
        metadataPrefix
      }
    })

    // parse xml
    const obj = await parseOaiPmhXml(res.body)

    // parse object
    return get(obj, 'GetRecord.record')
  }

  async identify () {
    // send request
    const res = await this.request({
      url: this.baseUrl,
      qs: {
        verb: 'Identify'
      }
    })

    // parse xml
    const obj = await parseOaiPmhXml(res.body)

    // parse object
    return obj.Identify
  }

  listIdentifiers (options = {}) {
    return getOaiListItems(this, 'ListIdentifiers', 'header', options)
  }

  async listMetadataFormats (options = {}) {
    // send request
    const res = await this.request({
      url: this.baseUrl,
      qs: {
        verb: 'ListMetadataFormats',
        identifier: options.identifier
      }
    })

    // parse xml
    const obj = await parseOaiPmhXml(res.body)

    // parse object
    return get(obj, 'ListMetadataFormats.metadataFormat')
  }

  listRecords (options) {
    return getOaiListItems(this, 'ListRecords', 'record', options)
  }

  listSets () {
    return getOaiListItems(this, 'ListSets', 'set')
  }
}
