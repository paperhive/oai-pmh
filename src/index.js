import { promisify } from 'bluebird';
import co from 'co';
import { assign, clone, get } from 'lodash';
import request from 'request';

import { AsyncIterable, OaiPmhError, parseOaiPmhXml, sleep } from './utils';

// iterable for OAI PMH list results
class OaiPmhListIterable extends AsyncIterable {
  constructor(harvester, verb, field, options = {}) {
    super();
    this.harvester = harvester;
    this.verb = verb;
    this.field = field;
    this.options = options;
  }

  getNext() {
    const self = this;
    return co(function* _getNext() {
      if (!self.currentResult ||
          self.currentIndex >= self.currentResult[self.field].length) {
        let res;
        // no results yet?
        if (!self.currentResult) {
          // send first request
          const query = clone(self.options);
          query.verb = self.verb;
          res = yield self.harvester.request({
            url: self.harvester.baseUrl,
            qs: query,
          });
        } else {
          // fetch next list
          res = yield self.harvester.request({
            url: self.harvester.baseUrl,
            qs: {
              verb: self.verb,
              resumptionToken: self.currentResult.resumptionToken._,
            },
          });
        }

        // parse xml
        const obj = yield parseOaiPmhXml(res.body);

        // store current result and initialize index
        self.currentResult = obj[self.verb];
        self.currentIndex = 0;
      }

      const list = self.currentResult[self.field];
      const token = self.currentResult.resumptionToken;
      const ret = list[self.currentIndex++];

      // is this the last element?
      if (self.currentIndex >= list.length) {
        // do we have a resumption token?
        if (token) {
          let cursor = get(token, '$.cursor');
          let completeListSize = get(token, '$.completeListSize');
          if (cursor !== undefined && completeListSize !== undefined) {
            cursor = parseInt(cursor, 10);
            completeListSize = parseInt(completeListSize, 10);
            if (cursor + list.length >= completeListSize) {
              // we got 'em all
              self.done();
            }
          }
        } else {
          // no resumption token
          self.done();
        }
      }

      return ret;
    });
  }
}

// main class
export class OaiPmh {
  constructor(baseUrl, _options = {}) {
    this.baseUrl = baseUrl;

    // default options
    this.options = {
      retry: true,  // automatically retry in case of status code 503
      retryMin: 5,  // wait at least 5 seconds
      retryMax: 600, // wait at maximum 600 seconds
    };
    // set user-provided options
    assign(this.options, _options);
  }

  // OAI-PMH request with retries for status code 503
  request(options) {
    const ctx = this;
    return co(function* _request() {
      let res;

      // loop until request succeeds (with retry: true)
      do {
        res = yield promisify(request)(options);

        // retry?
        if (res.statusCode === 503 && ctx.options.retry) {
          // get and parse retry-after header
          const retryAfter = res.headers['retry-after'];

          if (!retryAfter) {
            throw new OaiPmhError('Status code 503 without Retry-After header.');
          }

          // compute seconds to wait
          let retrySeconds;
          if (/^\s*\d+\s*$/.test(retryAfter)) {
            // integer: seconds to wait
            retrySeconds = parseInt(retryAfter, 10);
          } else {
            // http-date: date to await
            const retryDate = new Date(retryAfter);
            if (!retryDate) {
              throw new OaiPmhError('Status code 503 with invalid Retry-After header.');
            }
            retrySeconds = Math.floor((retryDate - new Date()) / 1000);
          }

          // sanitize
          if (retrySeconds < ctx.options.retryMin) {
            retrySeconds = ctx.options.retryMin;
          }
          if (retrySeconds > ctx.options.retryMax) {
            retrySeconds = ctx.options.retryMax;
          }

          // wait
          yield sleep(retrySeconds);
        }
      } while (res.statusCode === 503 && ctx.options.retry);

      if (res.statusCode !== 200) {
        throw new OaiPmhError(
          `Unexpected status code ${res.statusCode} (expected 200).`
        );
      }

      return res;
    });
  }

  getRecord(identifier, metadataPrefix) {
    const ctx = this;
    return co(function* _identify() {
      // send request
      const res = yield ctx.request({
        url: ctx.baseUrl,
        qs: {
          verb: 'GetRecord',
          identifier,
          metadataPrefix,
        },
      });

      // parse xml
      const obj = yield parseOaiPmhXml(res.body);

      // parse object
      return get(obj, 'GetRecord.record');
    });
  }

  /**
   * Identifies a provider
   *
   * @return {Promise}
   */
  identify() {
    const ctx = this;
    return co(function* _identify() {
      // send request
      const res = yield ctx.request({
        url: ctx.baseUrl,
        qs: {
          verb: 'Identify',
        },
      });

      // parse xml
      const obj = yield parseOaiPmhXml(res.body);

      // parse object
      return obj.Identify;
    });
  }

  listIdentifiers(options = {}) {
    return new OaiPmhListIterable(this, 'ListIdentifiers', 'header', options);
  }

  listMetadataFormats(options = {}) {
    const ctx = this;
    return co(function* _listMetadataFormats() {
      // send request
      const res = yield ctx.request({
        url: ctx.baseUrl,
        qs: {
          verb: 'ListMetadataFormats',
          identifier: options.identifier,
        },
      });

      // parse xml
      const obj = yield parseOaiPmhXml(res.body);

      // parse object
      return get(obj, 'ListMetadataFormats.metadataFormat');
    });
  }

  listRecords(options) {
    return new OaiPmhListIterable(this, 'ListRecords', 'record', options);
  }

  listSets() {
    return new OaiPmhListIterable(this, 'ListSets', 'set');
  }
}
