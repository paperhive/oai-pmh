import co from 'co';
import { back as nockBack } from 'nock';
import path from 'path';

import { AsyncIterable, sleep } from '../src/utils';

// generator/yield-version of the async/await-based mochaAsync
export function mochaAsync(fn) {
  return function (done) {
    const ctx = this;
    co(function* () {
      yield fn(ctx);
    }).then(done, done);
  };
}

// based on https://github.com/porchdotcom/nock-back-mocha/
const nockFixtureDir = path.resolve(__dirname, './nockFixtures');

export const nockFixtures = function (dir = nockFixtureDir, timeout = 15000) {
  const filenames = [];
  return {
    beforeEach(cb) {
      const test = this.currentTest;

      let filename = test.title;
      for (let el = test.parent; el; el = el.parent) {
        if (el.title.length) {
          filename = `${el.title} ${filename}`;
        }
      }
      filename = `${filename.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.json`;

      // use provided timeout when not in lockdown mode
      if (nockBack.currentMode !== 'lockdown') {
        test.timeout(test.timeout() + timeout);
      }

      if (filenames.indexOf(filename) !== -1) {
        return cb(new Error(`${filename} has already been used in another test`));
      }
      filenames.push(filename);

      nockBack.fixtures = dir;

      nockBack(filename, (nockDone) => {
        test.nockDone = nockDone;
        cb();
      });
    },
    afterEach() {
      this.currentTest.nockDone();
    },
  };
};

describe('AsyncIterable', () => {
  class TestIterable extends AsyncIterable {
    constructor(throws = false) {
      super();
      this.throws = throws;
      this.num = 0;
    }

    getNext() {
      const self = this;
      return co(function* () {
        if (self.throws) {
          throw new Error('Just throwin\'');
        }

        yield sleep(0.01);
        const ret = self.num++;

        // is this the last element?
        if (ret >= 3) {
          self.done();
        }
        return ret;
      });
    }
  }

  it('should be iterable', mochaAsync(function* () {
    const res = [];
    for (const nextPromise of new TestIterable()) {
      const next = yield nextPromise;
      res.push(next);
    }
    res.should.deepEqual([0, 1, 2, 3]);
  }));

  it('should throw an error if yield is missing', mochaAsync(function* () {
    yield co(function* () {
      const res = [];
      for (const nextPromise of new TestIterable()) {
        res.push(nextPromise);
      }
    }).should.be.rejectedWith(Error);
  }));

  it('should throw an error if getNext throws', mochaAsync(function* () {
    yield co(function* () {
      const res = [];
      for (const nextPromise of new TestIterable(true)) {
        const next = yield nextPromise;
        res.push(next);
      }
    }).should.be.rejectedWith(Error);
  }));
});
