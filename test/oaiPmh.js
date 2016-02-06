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
});
