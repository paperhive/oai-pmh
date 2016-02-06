import { promisify } from 'bluebird';
import co from 'co';
import { get } from 'lodash';
import request from 'request';
import { parseString } from 'xml2js';

const requestAsync = promisify(request);
const parseXml = promisify(parseString);

const xmlOptions = {
  explicitArray: false,
};

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

      // parse xml into js object
      const obj = yield parseXml(res.body, xmlOptions);

      // parse object
      return get(obj, 'OAI-PMH.Identify');
    });
  }

  listMetadataFormats() {
    const ctx = this;
    return co(function* _identify() {
      // send request
      const res = yield requestAsync({
        url: ctx.baseUrl,
        qs: {
          verb: 'ListMetadataFormats',
        },
      });

      // parse xml into js object
      const obj = yield parseXml(res.body, xmlOptions);

      // parse object
      return get(obj, 'OAI-PMH.ListMetadataFormats.metadataFormat');
    });
  }
}
