import { promisify } from 'bluebird';
import co from 'co';
import { get } from 'lodash';
import request from 'request';
import { parseString } from 'xml2js';

const requestAsync = promisify(request);

export class OaiPmhError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

// test if the parsed xml contains an error
const parseOaiPmhXml = co.wrap(function* _parseOaiPmhXml(xml) {
  // parse xml into js object
  const obj = yield promisify(parseString)(xml, {
    explicitArray: false,
  });

  const oaiPmh = obj && obj['OAI-PMH'];

  if (!oaiPmh) {
    throw new OaiPmhError('Returned data does not conform to OAI-PMH');
  }

  const error = oaiPmh.error;
  if (error) {
    throw new OaiPmhError(
      `OAI-PMH provider returned an error: ${error._}`,
      get(error, '$.code')
    );
  }

  return oaiPmh;
});

export class OaiPmh {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
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
      const res = yield requestAsync({
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

  listMetadataFormats(options = {}) {
    const ctx = this;
    return co(function* _identify() {
      // send request
      const res = yield requestAsync({
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
    return co(function* _identify() {
      // send request
      const res = yield requestAsync({
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
