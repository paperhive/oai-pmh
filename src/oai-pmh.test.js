import { nockFixtures } from '../test/nock'

import { OaiPmhError } from './errors'
import { OaiPmh } from './oai-pmh'

const arxivBaseUrl = 'http://export.arxiv.org/oai2'
const exlibrisBaseUrl = 'http://bibsys-network.alma.exlibrisgroup.com/view/oai/47BIBSYS_NETWORK/request'
const gulbenkianBaseUrl = 'http://arca.igc.gulbenkian.pt/oaiextended/request'

const record = {
  header: {
    identifier: 'oai:arXiv.org:1412.8544',
    datestamp: '2015-01-03',
    setSpec: 'cs'
  },
  metadata: {
    arXiv: {
      created: '2014-12-29',
      id: '1412.8544'
    }
  }
}

describe('OaiPmh', () => {
  // set up nock, nock, nock'in on heaven's door
  const nockFixture = nockFixtures()
  beforeEach(nockFixture.beforeEach)
  afterEach(nockFixture.afterEach)

  describe('getRecord()', () => {
    it('should get a record', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const res = await oaiPmh.getRecord('oai:arXiv.org:1412.8544', 'arXiv')
      res.should.containDeep(record)
    })
  })

  describe('identify()', () => {
    it('should identify arxiv', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const res = await oaiPmh.identify()
      res.should.containDeep({
        repositoryName: 'arXiv',
        baseURL: 'http://export.arxiv.org/oai2',
        protocolVersion: '2.0',
        adminEmail: 'help@arxiv.org',
        earliestDatestamp: '2007-05-23',
        deletedRecord: 'persistent',
        granularity: 'YYYY-MM-DD'
      })
    })
  })

  describe('listIdentifiers()', function () {
    // the first request to arxiv always fails with 503 and a
    // "retry after 20 seconds" message (which is OAI-PMH-compliant)
    this.timeout(90000)

    it('should list identifiers from arxiv', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const options = {
        metadataPrefix: 'arXiv',
        from: '2009-01-01',
        until: '2009-01-02'
      }
      const res = []
      for await (const identifier of oaiPmh.listIdentifiers(options)) {
        res.push(identifier)
      }
      res.should.containDeep([{
        identifier: 'oai:arXiv.org:0807.0148',
        datestamp: '2009-01-01',
        setSpec: 'physics:hep-ex'
      }])
      res.should.have.length(86)
    })

    it('should list identifiers with resumption token from exlibris', async () => {
      const oaiPmh = new OaiPmh(exlibrisBaseUrl)
      const options = {
        metadataPrefix: 'marc21',
        set: 'oai_komplett',
        from: '2017-01-01',
        until: '2017-01-03'
      }
      const res = []
      for await (const identifier of oaiPmh.listIdentifiers(options)) {
        res.push(identifier)
      }
      res.should.containDeep([{
        identifier: 'oai:urm_publish:999919908001402201',
        datestamp: '2017-01-02T14:54:37Z',
        setSpec: 'oai_komplett'
      }])
      res.should.have.length(110)
    })

    it('should list identifiers with resumption token from gulbenkian', async () => {
      const oaiPmh = new OaiPmh(gulbenkianBaseUrl)
      const options = {
        metadataPrefix: 'oai_dc',
        from: '2016-01-01',
        until: '2017-01-01'
      }
      const res = []
      for await (const identifier of oaiPmh.listIdentifiers(options)) {
        res.push(identifier)
      }
      res.should.containDeep([{
        identifier: 'oai:arca.igc.gulbenkian.pt:10400.7/724',
        datestamp: '2016-12-01T03:00:19Z',
        setSpec: ['com_10400.7_266', 'col_10400.7_268']
      }])
      res.should.have.length(154)
    })
  })

  describe('listMetadataFormats()', () => {
    const metadataFormats = [
      {
        metadataPrefix: 'oai_dc',
        schema: 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd',
        metadataNamespace: 'http://www.openarchives.org/OAI/2.0/oai_dc/'
      },
      {
        metadataPrefix: 'arXiv',
        schema: 'http://arxiv.org/OAI/arXiv.xsd',
        metadataNamespace: 'http://arxiv.org/OAI/arXiv/'
      }
    ]

    it('should list metadata formats for arxiv', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const res = await oaiPmh.listMetadataFormats()
      res.should.containDeep(metadataFormats)
    })

    it('should list metadata formats for arxiv id 1208.0264', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const res = await oaiPmh.listMetadataFormats({
        identifier: 'oai:arXiv.org:1208.0264'
      })
      res.should.containDeep(metadataFormats)
    })

    it('should fail for non-existent arxiv id lolcat', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      oaiPmh.listMetadataFormats({
        identifier: 'oai:arXiv.org:lolcat'
      }).should.be.rejectedWith(OaiPmhError)
    })
  })

  describe('listRecords()', function () {
    // the first request to arxiv always fails with 503 and a
    // "retry after 20 seconds" message (which is OAI-PMH-compliant)
    this.timeout(30000)

    it('should list identifiers from arxiv', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const options = {
        metadataPrefix: 'arXiv',
        from: '2015-01-01',
        until: '2015-01-03'
      }
      const res = []
      for await (const record of oaiPmh.listRecords(options)) {
        res.push(record)
      }
      res.should.containDeep([record])
      res.should.have.length(2)
    })
  })

  describe('listSets()', () => {
    it('should list arxiv sets', async () => {
      const oaiPmh = new OaiPmh(arxivBaseUrl)
      const res = []
      for await (const set of oaiPmh.listSets()) {
        res.push(set)
      }
      res.should.containDeep([
        { setSpec: 'cs', setName: 'Computer Science' },
        { setSpec: 'math', setName: 'Mathematics' },
        { setSpec: 'physics', setName: 'Physics' },
        { setSpec: 'physics:astro-ph', setName: 'Astrophysics' },
        { setSpec: 'q-bio', setName: 'Quantitative Biology' },
        { setSpec: 'q-fin', setName: 'Quantitative Finance' },
        { setSpec: 'stat', setName: 'Statistics' }
      ])
    })
  })
})
