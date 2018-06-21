const _ = require('lodash')
const program = require('commander')

const oaiPmhModule = require('../')
const pkg = require('../package.json')

program
  .version(pkg.version)

async function wrapAsync (fun) {
  fun().then(
    () => process.exit(0),
    (err) => {
      process.stderr.write(`${err.toString()}\n`)
      process.exit(1)
    }
  )
}

function printJson (obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`)
}

function * printList (promiseGenerator) {
  for (const itemPromise of promiseGenerator) {
    const item = yield itemPromise
    printJson(item)
  }
}

program
  .command('get-record <baseUrl>')
  .option('-i, --identifier <id>')
  .option('-p, --metadata-prefix <prefix>')
  .action((baseUrl, options) => wrapAsync(async () => {
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    const result = await oaiPmh.getRecord(options.identifier, options.metadataPrefix)
    printJson(result)
  }))

program
  .command('identify <baseUrl>')
  .action(baseUrl => wrapAsync(async () => {
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    const result = await oaiPmh.identify()
    printJson(result)
  }))

program
  .command('list-identifiers <baseUrl>')
  .option('-p, --metadata-prefix <prefix>')
  .option('-f, --from <DATE>', 'from date YYYY-MM-DD or ISO8601')
  .option('-u, --until <DATE>', 'from date YYYY-MM-DD or ISO8601')
  .option('-s, --set <SETSPEC>', 'set specifier, e.g., "math"')
  .action((baseUrl, _options) => wrapAsync(async () => {
    const options = _.pick(_options, 'metadataPrefix', 'from', 'until', 'set')
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    await printList(oaiPmh.listIdentifiers(options))
  }))

program
  .command('list-metadata-formats <baseUrl>')
  .option('-i, --identifier <id>')
  .action((baseUrl, _options) => wrapAsync(async () => {
    const options = _.pick(_options, 'identifier')
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    const result = await oaiPmh.listMetadataFormats(options)
    printJson(result)
  }))

program
  .command('list-records <baseUrl>')
  .option('-p, --metadata-prefix <prefix>')
  .option('-f, --from <DATE>', 'from date YYYY-MM-DD or ISO8601')
  .option('-u, --until <DATE>', 'from date YYYY-MM-DD or ISO8601')
  .option('-s, --set <SETSPEC>', 'set specifier, e.g., "math"')
  .action((baseUrl, _options) => run(function * listRecords () {
    const options = _.pick(_options, 'metadataPrefix', 'from', 'until', 'set')
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    yield printList(oaiPmh.listRecords(options))
  }))

program
  .command('list-sets <baseUrl>')
  .action(baseUrl => run(function * listSets () {
    const oaiPmh = new oaiPmhModule.OaiPmh(baseUrl)
    yield printList(oaiPmh.listSets())
  }))

program.parse(process.argv)
