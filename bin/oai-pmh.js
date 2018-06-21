import { pick } from 'lodash'
import program from 'commander'

import { OaiPmh } from '../'
import pkg from '../package.json'

program.version(pkg.version)

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

async function printList (asyncGenerator) {
  for await (const item of asyncGenerator) {
    printJson(item)
  }
}

program
  .command('get-record <baseUrl>')
  .option('-i, --identifier <id>')
  .option('-p, --metadata-prefix <prefix>')
  .action((baseUrl, options) => wrapAsync(async () => {
    const oaiPmh = new OaiPmh(baseUrl)
    const result = await oaiPmh.getRecord(options.identifier, options.metadataPrefix)
    printJson(result)
  }))

program
  .command('identify <baseUrl>')
  .action(baseUrl => wrapAsync(async () => {
    const oaiPmh = new OaiPmh(baseUrl)
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
    const options = pick(_options, 'metadataPrefix', 'from', 'until', 'set')
    const oaiPmh = new OaiPmh(baseUrl)
    await printList(oaiPmh.listIdentifiers(options))
  }))

program
  .command('list-metadata-formats <baseUrl>')
  .option('-i, --identifier <id>')
  .action((baseUrl, _options) => wrapAsync(async () => {
    const options = pick(_options, 'identifier')
    const oaiPmh = new OaiPmh(baseUrl)
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
    const options = pick(_options, 'metadataPrefix', 'from', 'until', 'set')
    const oaiPmh = new OaiPmh(baseUrl)
    yield printList(oaiPmh.listRecords(options))
  }))

program
  .command('list-sets <baseUrl>')
  .action(baseUrl => run(function * listSets () {
    const oaiPmh = new OaiPmh(baseUrl)
    yield printList(oaiPmh.listSets())
  }))

program.parse(process.argv)
