import retryableFetch from 'retryable-fetch/index.mjs'

class ApiClientBase {
  constructor (baseUrl, options = {}) {
    options = Object.assign({
      retryAfter: [],
      fetch: undefined
    }, options)

    this.baseUrl = baseUrl
    const _fetch = typeof fetch === 'undefined' ? options.fetch : window.fetch.bind(window)
    this._fetch = retryableFetch(_fetch, {
      retryAfter: options.retryAfter
    })
  }

  validateFetch () {}

  async authorise (accessToken) {
    if (accessToken) {
      this.accessToken = accessToken
    } else {
      /* OAUTH */
    }
  }

  async fetch (path, options = {}) {
    this.validateFetch()
    const fetchOptions = Object.assign({}, {
      headers: {}
    }, options)
    if (this.accessToken) {
      fetchOptions.headers.Authorization = `Bearer ${this.accessToken}`
    }
    // console.log(`${this.baseUrl}${path}`, fetchOptions)
    const response = await this._fetch(`${this.baseUrl}${path}`, fetchOptions)
    if (response.ok) {
      return response
    } else {
      const err = new Error(`${response.status}: ${response.statusText}`)
      err.name = response.status
      err.response = response
    }
  }

  async fetchJson (path, options) {
    const response = await this.fetch(path, options)
    return response.json()
  }

  async fetchText (path, options) {
    const response = await this.fetch(path, options)
    return response.text()
  }
}

function encodeBase64 (input) {
  if (typeof btoa === 'undefined') {
    return Buffer.from(input).toString('base64')
  } else {
    return btoa(input)
  }
}

export default ApiClientBase
