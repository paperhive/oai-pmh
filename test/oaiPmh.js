import { OaiPmh } from '../';
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

  describe('listMetadataFormats()', () => {
    it('should list arxiv metadata formats', mochaAsync(function* () {
      const oaiPmh = new OaiPmh(baseUrl);
      const res = yield oaiPmh.listMetadataFormats();
      res.should.containDeep([
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
      ]);
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
