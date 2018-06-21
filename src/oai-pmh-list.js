import { get } from 'lodash'

import { AsyncIterable } from './async-iterable'
import { parseOaiPmhXml } from './oai-pmh-xml'

// iterable for OAI PMH list results
export class OaiPmhListIterable extends AsyncIterable {
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
        const query = {...this.options}
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
