[![view on npm](https://badgen.net/npm/v/@client-zone/base)](https://www.npmjs.org/package/@client-zone/base)
[![npm module downloads](https://badgen.net/npm/dt/@client-zone/base)](https://www.npmjs.org/package/@client-zone/base)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/client-zone/base)](https://github.com/client-zone/base/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/client-zone/base)](https://github.com/client-zone/base/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/client-zone/base/actions/workflows/node.js.yml/badge.svg)](https://github.com/client-zone/base/actions/workflows/node.js.yml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# @client-zone/base

An isomorphic base class defining common logic used by all `@client-zone` API clients. Requires Node.js v18 and above for built-in fetch.

## Exception structure

```
Error: 404: Not Found
    at NpmDownloads.fetch (file:///Users/lloyd/Documents/client-zone/npm/node_modules/@client-zone/base/index.js:57:25)
    ...etc
  request: {
    url: 'https://api.npmjs.org/downloads/point/last-month/@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf',
    fetchOptions: {}
  },
  response: {
    status: 404,
    statusText: 'Not Found',
    body: '{"error":"package @akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf not found"}',
    headers: Headers {
      date: 'Sun, 01 Sep 2024 18:29:37 GMT',
      'content-type': 'application/json; charset=utf-8',
      ...etc
    }
  }
}
```

* * *

&copy; 2021-24 [Lloyd Brookes](https://github.com/75lb) \<75pound@gmail.com\>.

Tested by [test-runner](https://github.com/test-runner-js/test-runner).
