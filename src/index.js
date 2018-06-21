import { promisify } from 'bluebird'
import { assign, clone, get } from 'lodash'
import request from 'request'

import { AsyncIterable, OaiPmhError, parseOaiPmhXml, sleep } from './utils'

export { OaiPmhError }

// iterable for OAI PMH list results
class OaiPmhListIterable extends AsyncIterable {
  constructor (harvester, verb, field, options = {}) {
    super()
    this.harvester = harvester
    this.verb = verb
    this.field = field
    this.options = options
  }

  async getNext () {
    if (!this.currentResult ||
        this.currentIndex >= this.currentResult[this.field].length) {
      let res
      // no results yet?
      if (!this.currentResult) {
        // send first request
        const query = clone(this.options)
        query.verb = this.verb
        res = await this.harvester.request({
          url: this.harvester.baseUrl,
          qs: query
        })
      } else {
        // fetch next list
        res = await this.harvester.request({
          url: this.harvester.baseUrl,
          qs: {
            verb: this.verb,
            resumptionToken: this.currentResult.resumptionToken._
          }
        })
      }

      // parse xml
      const obj = await parseOaiPmhXml(res.body)

      // store current result and initialize index
      this.currentResult = obj[this.verb]
      this.currentIndex = 0
    }

    const list = this.currentResult[this.field]
    const token = this.currentResult.resumptionToken
    const ret = list[this.currentIndex++]

    // is this the last element?
    if (this.currentIndex >= list.length) {
      // do we have a resumption token?
      if (token) {
        let cursor = get(token, '$.cursor')
        let completeListSize = get(token, '$.completeListSize')
        if (cursor !== undefined && completeListSize !== undefined) {
          cursor = parseInt(cursor, 10)
          completeListSize = parseInt(completeListSize, 10)
          if (cursor + list.length >= completeListSize) {
            // we got 'em all
            this.done()
          }
        }
      } else {
        // no resumption token
        this.done()
      }
    }

    return ret
  }
}

// main class
export class OaiPmh {
  constructor (baseUrl, _options = {}) {
    this.baseUrl = baseUrl

    // default options
    this.options = {
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
      res = await promisify(request)(options)

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
    return new OaiPmhListIterable(this, 'ListIdentifiers', 'header', options)
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
    return new OaiPmhListIterable(this, 'ListRecords', 'record', options)
  }

  listSets () {
    return new OaiPmhListIterable(this, 'ListSets', 'set')
  }
}
