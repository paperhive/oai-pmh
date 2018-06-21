import { back as nockBack } from 'nock'
import path from 'path'

// based on https://github.com/porchdotcom/nock-back-mocha/
const nockFixtureDir = path.resolve(__dirname, './nockFixtures')

export const nockFixtures = function (dir = nockFixtureDir, timeout = 15000) {
  const filenames = []
  return {
    beforeEach (cb) {
      const test = this.currentTest

      let filename = test.title
      for (let el = test.parent; el; el = el.parent) {
        if (el.title.length) {
          filename = `${el.title} ${filename}`
        }
      }
      filename = `${filename.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.json`

      // use provided timeout when not in lockdown mode
      if (nockBack.currentMode !== 'lockdown') {
        test.timeout(test.timeout() + timeout)
      }

      if (filenames.indexOf(filename) !== -1) {
        return cb(new Error(`${filename} has already been used in another test`))
      }
      filenames.push(filename)

      nockBack.fixtures = dir

      nockBack(filename, (nockDone) => {
        test.nockDone = nockDone
        cb()
      })
    },
    afterEach () {
      this.currentTest.nockDone()
    }
  }
}
