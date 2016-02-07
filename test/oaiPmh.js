import { OaiPmh, OaiPmhError } from '../';
import { mochaAsync } from './utils';

const baseUrl = 'http://export.arxiv.org/oai2';

describe('OaiPmh', () => {
  describe('identify()', () => {
    it('should identify arxiv', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      const res = yield oaiPmh.identify();
      res.should.containDeep({
        repositoryName: 'arXiv',
        baseURL: 'http://export.arxiv.org/oai2',
        protocolVersion: '2.0',
        adminEmail: 'help@arxiv.org',
        earliestDatestamp: '2007-05-23',
        deletedRecord: 'persistent',
        granularity: 'YYYY-MM-DD',
      });
    }));
  });

  /*
  describe('listIdentifiers()', () => {
    it('should list identifiers from arxiv', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      for (const identifierPromise of oaiPmh.listIdentifiers()) {
        const identifier = yield identifierPromise;
        console.log(identifier);
      }
    }));
  });
  */

  describe('listMetadataFormats()', () => {
    const metadataFormats = [
      {
        metadataPrefix: 'oai_dc',
        schema: 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd',
        metadataNamespace: 'http://www.openarchives.org/OAI/2.0/oai_dc/',
      },
      {
        metadataPrefix: 'arXiv',
        schema: 'http://arxiv.org/OAI/arXiv.xsd',
        metadataNamespace: 'http://arxiv.org/OAI/arXiv/',
      },
    ];

    it('should list metadata formats for arxiv', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      const res = yield oaiPmh.listMetadataFormats();
      res.should.containDeep(metadataFormats);
    }));

    it('should list metadata formats for arxiv id 1208.0264', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      const res = yield oaiPmh.listMetadataFormats({
        identifier: 'oai:arXiv.org:1208.0264',
      });
      res.should.containDeep(metadataFormats);
    }));

    it('should fail for non-existent arxiv id lolcat', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      oaiPmh.listMetadataFormats({
        identifier: 'oai:arXiv.org:lolcat',
      }).should.be.rejectedWith(OaiPmhError);
    }));
  });

  describe('listSets()', () => {
    it('should list arxiv sets', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      const res = yield oaiPmh.listSets();
      res.should.containDeep([
        { setSpec: 'cs', setName: 'Computer Science' },
        { setSpec: 'math', setName: 'Mathematics' },
        { setSpec: 'physics', setName: 'Physics' },
        { setSpec: 'physics:astro-ph', setName: 'Astrophysics' },
        { setSpec: 'q-bio', setName: 'Quantitative Biology' },
        { setSpec: 'q-fin', setName: 'Quantitative Finance' },
        { setSpec: 'stat', setName: 'Statistics' },
      ]);
    }));
  });
});
