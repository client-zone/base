'use strict';

function _classPrivateFieldGet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
  return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
  _classApplyDescriptorSet(receiver, descriptor, value);
  return value;
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to " + action + " private field on non-instance");
  }
  return privateMap.get(receiver);
}
function _classApplyDescriptorGet(receiver, descriptor) {
  if (descriptor.get) {
    return descriptor.get.call(receiver);
  }
  return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }
    descriptor.value = value;
  }
}
function _checkPrivateRedeclaration(obj, privateCollection) {
  if (privateCollection.has(obj)) {
    throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
}
function _classPrivateFieldInitSpec(obj, privateMap, value) {
  _checkPrivateRedeclaration(obj, privateMap);
  privateMap.set(obj, value);
}

var _fetch = /*#__PURE__*/new WeakMap();
class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.fetch] {object} - Defaults to `window.fetch` unless an alternative is passed in.
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   */
  constructor(options = {}) {
    _classPrivateFieldInitSpec(this, _fetch, {
      writable: true,
      value: void 0
    });
    options = Object.assign({
      fetch: undefined
    }, options);
    this.options = options;
    this.baseUrl = options.baseUrl || '';
    _classPrivateFieldSet(this, _fetch, typeof fetch === 'undefined' ? options.fetch : fetch);
  }

  /**
   * Called just before the fetch is made. Override to modify the fetchOptions. Used by clients which set bespoke security headers.
   */
  preFetch(url, fetchOptions) {}

  /**
   * @param [options] {object}
   * @param [options.skipPreFetch] {boolean}
   * @returns {Response}
   */
  async fetch(path, options = {}) {
    const fetchOptions = Object.assign({}, {
      headers: {}
    }, options);
    const url = `${this.baseUrl}${path}`;
    if (!options.skipPreFetch) {
      this.preFetch(url, fetchOptions);
    }
    const response = await _classPrivateFieldGet(this, _fetch).call(this, url, fetchOptions);
    if (response.ok) {
      return response;
    } else {
      const err = new Error(`${response.status}: ${response.statusText}`);
      err.request = {
        url,
        fetchOptions
      };
      err.response = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers
      };
      throw err;
    }
  }
  async fetchJson(path, options) {
    const response = await this.fetch(path, options);
    return response.json();
  }
  async fetchText(path, options) {
    const response = await this.fetch(path, options);
    return response.text();
  }
  async graphql(url, query, variables) {
    const json = await this.fetchJson(url, {
      method: 'POST',
      body: JSON.stringify({
        query,
        variables
      }),
      headers: {
        'content-type': 'application/json'
      }
    });
    if (json.errors) {
      const err = new Error('graphql request failed');
      err.responseBody = json;
      throw err;
    } else {
      return json;
    }
  }
}

module.exports = ApiClientBase;
