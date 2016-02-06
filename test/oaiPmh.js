import { OaiPmh } from '../';

const baseUrl = 'http://export.arxiv.org/oai2';

describe('OaiPmh', () => {
  it('should store the baseUrl', () => {
    const oaiPmh = new OaiPmh(baseUrl);
    oaiPmh.baseUrl.should.equal(baseUrl);
  });
});
