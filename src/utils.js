import { promisify } from 'bluebird';
import co from 'co';
import { get } from 'lodash';
import { parseString } from 'xml2js';

// error class for OAI-PMH errors
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
export const parseOaiPmhXml = co.wrap(function* _parseOaiPmhXml(xml) {
  // parse xml into js object
  const obj = yield promisify(parseString)(xml, {
    explicitArray: false,
    trim: true,
    normalize: true,
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

// sleep via promise
export const sleep = co.wrap(function* _sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
});

export class AsyncIterable {
  constructor() {
    if (this.getNext === undefined) {
      throw new Error(
        'Derived class must implement a getNext method that returns a promise'
      );
    }
    this._done = false;
  }

  done() {
    this._done = true;
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        // has the last element been returned?
        if (this._done) {
          return { done: true };
        }

        // make sure that no promise is currently running
        if (this.running) {
          throw new Error('There is still a promise running. Did you forget to yield it?');
        }

        // make sure that the last promise wasn't rejected
        if (this.failed) {
          throw new Error('The last promise failed. Check your error handling.');
        }

        // set state to running
        this.running = true;

        // get next promise
        const next = this.getNext();

        // hook to next promise
        next.then(
          // resolved
          () => {this.running = false;},
          // rejected
          (e) => {this.failed = true; throw e;}
        );

        return { value: next };
      },
    };
  }
}
