# OAI PMH
[![travis-ci](https://travis-ci.org/paperhive/oai-pmh.svg?branch=master)](https://travis-ci.org/paperhive/oai-pmh)
[![codecov.io](https://codecov.io/github/paperhive/oai-pmh/coverage.svg?branch=master)](https://codecov.io/github/paperhive/oai-pmh?branch=master)
[![npm](https://img.shields.io/npm/v/oai-pmh.svg)](https://www.npmjs.com/package/oai-pmh)

A nodejs module for the Open Archives Initiative Protocol for Metadata Harvesting ([OAI-PMH 2.0](http://www.openarchives.org/OAI/openarchivesprotocol.html)). Use this module if you want to harvest metadata from OAI-PMH providers, e.g., [arxiv](http://arxiv.org/).

# Installation
```
npm install oai-pmh
```

# Library

## Example

```javascript
import { OaiPmh } from 'oai-pmh';

const oaiPmh = new OaiPmh('http://export.arxiv.org/oai2');
for await (const identifier of oaiPmh.listIdentifiers({from: '2017-11-01'})) {
  // do something with identifier
}
```

See [OaiPmh in oai-pmh.js](https://github.com/paperhive/oai-pmh/blob/master/src/oai-pmh.js)
for all available commands.


# CLI

## Example
Get identifiers of all arxiv articles:
```
oai-pmh list-identifiers http://export.arxiv.org/oai2 -p arXiv
```
## Available commands

### `get-record`

```
oai-pmh get-record <baseUrl>

Options:

  -i, --identifier <id>
  -p, --metadata-prefix <prefix>
```

### `identify`

```
oai-pmh identify <baseUrl>
```

### `list-identifiers`

```
oai-pmh list-identifiers [options] <baseUrl>

Options:

  -p, --metadata-prefix <prefix>
  -f, --from <DATE>               from date YYYY-MM-DD or ISO8601
  -u, --until <DATE>              from date YYYY-MM-DD or ISO8601
  -s, --set <SETSPEC>             set specifier, e.g., "math"
```

### `list-metadata-formats`

```
oai-pmh list-metadata-formats [options] <baseUrl>

Options:

  -i, --identifier <id>
```

### `list-records`

```
oai-pmh list-records [options] <baseUrl>

Options:

  -p, --metadata-prefix <prefix>
  -f, --from <DATE>               from date YYYY-MM-DD or ISO8601
  -u, --until <DATE>              from date YYYY-MM-DD or ISO8601
  -s, --set <SETSPEC>             set specifier, e.g., "math"
```

### `list-sets`

```
oai-pmh list-sets <baseUrl>
```
