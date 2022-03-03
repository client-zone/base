class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.fetch] {object} - Defaults to `window.fetch` unless an alternative is passed in.
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   */
  constructor (options = {}) {
    options = Object.assign({
      fetch: undefined
    }, options)

    this.options = options
    this.baseUrl = options.baseUrl || ''
    this._fetch = typeof fetch === 'undefined' ? options.fetch : window.fetch.bind(window)
  }

  /**
   * Called just before the fetch is made. Override to modify the fetchOptions. Used by clients which set bespoke security headers.
   */
  preFetch (url, fetchOptions) {}

  /**
   * The core fetch method. Throws on error, 400 or 500.
   * @returns {Response}
   */
  async fetch (path, options = {}) {
    const fetchOptions = Object.assign({}, {
      headers: {}
    }, options)

    const url = `${this.baseUrl}${path}`
    this.preFetch(url, fetchOptions)
    const response = await this._fetch(url, fetchOptions)
    if (response.ok) {
      return response
    } else {
      const err = new Error(`${response.status}: ${response.statusText}`)
      err.response = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers
      }
      throw err
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

  async graphql (url, query, variables) {
    const json = await this.fetchJson(url, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
      headers: { 'content-type': 'application/json' }
    })
    if (json.errors) {
      const err = new Error('graphql request failed')
      err.responseBody = json
      throw err
    } else {
      return json
    }
  }
}

export default ApiClientBase
