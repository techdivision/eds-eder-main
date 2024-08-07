/*
 * Copyright (c) 2024 TechDivision GmbH
 * All rights reserved
 *
 * This product includes proprietary software developed at TechDivision GmbH, Germany
 * For more information see https://www.techdivision.com/
 *
 * To obtain a valid license for using this software please contact us at
 * license@techdivision.com
 */

// eslint-disable-next-line prefer-const
import ffetch from './vendor/ffetch.js';

const fetchCacheKey = 'fetch-cache';
// eslint-disable-next-line prefer-const
let loadedStorage = {};
// eslint-disable-next-line prefer-const
let onLoadStorage = {};

/**
 * Resolve loaded resource
 *
 * @param {String} href
 */
function resolveLoad(href) {
  loadedStorage[href] = true;
  if (onLoadStorage[href]) {
    onLoadStorage[href].forEach((resolve) => resolve());
    delete onLoadStorage[href];
  }
}

/**
 * Add resolver
 *
 * @param {String} href
 * @param {Function} resolve
 */
function addResolver(href, resolve) {
  if (loadedStorage[href]) {
    resolve();
  } else {
    onLoadStorage[href] = (onLoadStorage[href] || []);
    onLoadStorage[href].push(resolve);
  }
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */
async function betterLoadCSS(href) {
  return new Promise((resolve, reject) => {
    addResolver(href, resolve);
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolveLoad(href);
      link.onerror = reject;
      document.head.append(link);
    }
  });
}

/**
 * Loads a non module JS file.
 * @param {string} href URL to the JS file
 * @param {Object} [attrs] additional optional attributes
 */
async function betterLoadScript(href, attrs) {
  return new Promise((resolve, reject) => {
    addResolver(href, resolve);
    if (!document.querySelector(`head > script[src="${href}"]`)) {
      const script = document.createElement('script');
      script.src = href;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = () => resolveLoad(href);
      script.onerror = reject;
      document.head.append(script);
    }
  });
}

/**
 * Load third party module
 *
 * @param {String} name
 * @param {Function} callback
 */
function loadThirdPartyModule(name, callback) {
  Promise.all(
    [
      betterLoadCSS(`/styles/vendor/${name}.css`),
      import(`/scripts/vendor/${name}.js`),
    ],
  )
    .then(callback);
}

/**
 * Load third party bundle
 *
 * @param {String} name
 * @param {Function} callback
 */
function loadThirdPartyBundle(name, callback) {
  Promise.all(
    [
      betterLoadCSS(`/styles/vendor/${name}.css`),
      betterLoadScript(`/scripts/vendor/${name}.js`),
    ],
  )
    .then(callback);
}

/**
 * Cached fetch request
 *
 * @param {string} url
 * @returns {Promise}
 */
async function cachedFetch(url) {
  // open cache
  const cache = await caches.open(fetchCacheKey);

  // check if response is cached
  const cachedResponse = await cache.match(url);
  if (cachedResponse) {
    return Promise.resolve(await cachedResponse.json());
  }

  // if no cached response, perform a fetch
  return ffetch(url)
    .all()
    .then(async (data) => {
      // noinspection JSCheckFunctionSignatures
      await cache.put(url, new Response(JSON.stringify(data)));
      return data;
    });
}

/**
 * Clear fetch cache
 *
 * @returns {Promise<void>}
 */
async function clearFetchCache() {
  await caches.delete(fetchCacheKey);
}

export {
  betterLoadScript,
  betterLoadCSS,
  loadThirdPartyBundle,
  loadThirdPartyModule,
  cachedFetch,
  clearFetchCache,
};
