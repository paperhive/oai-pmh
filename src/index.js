import { promisify } from 'bluebird';
import co from 'co';
import { assign, get } from 'lodash';
import request from 'request';

import { AsyncIterable, OaiPmhError, parseOaiPmhXml, sleep } from './utils';

// iterable for OAI PMH list results
class OaiPmhListIterable extends AsyncIterable {
  constructor() {
    super();
    // TODO
  }

  // the actual job
  getNext() {
    // TODO
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

  /* TODO */
  listIdentifiers(options = {}) {
    return new OaiPmhListIterable();
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

  listSets() {
    const ctx = this;
    return co(function* _listSets() {
      // send request
      const res = yield ctx.request({
        url: ctx.baseUrl,
        qs: {
          verb: 'ListSets',
        },
      });

      // parse xml
      const obj = yield parseOaiPmhXml(res.body);

      // parse object
      return get(obj, 'ListSets.set');
    });
  }
}
