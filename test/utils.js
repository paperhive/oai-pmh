import co from 'co';

// generator/yield-version of the async/await-based mochaAsync
export function mochaAsync(fn) {
  return function (done) {
    const ctx = this;
    co(function* () {
      yield fn(ctx);
    }).then(done, done);
  };
}
