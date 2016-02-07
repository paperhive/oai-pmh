# OAI PMH [![travis-ci](https://travis-ci.org/paperhive/oai-pmh.svg?branch=master)](https://travis-ci.org/paperhive/oai-pmh) [![codecov.io](https://codecov.io/github/paperhive/oai-pmh/coverage.svg?branch=master)](https://codecov.io/github/paperhive/oai-pmh?branch=master) [![npm](https://img.shields.io/npm/v/oai-pmh.svg)](https://www.npmjs.com/package/oai-pmh)

A nodejs module for the Open Archives Initiative Protocol for Metadata Harvesting ([OAI-PMH 2.0](http://www.openarchives.org/OAI/openarchivesprotocol.html)). Use this module if you want to harvest metadata from OAI-PMH providers, e.g., [arxiv](http://arxiv.org/).

# Installation
```
npm install oai-pmh
```

# CLI
Get identifiers of all arxiv articles:
```
oai-pmh list-identifiers http://export.arxiv.org/oai2 -p arXiv
```
