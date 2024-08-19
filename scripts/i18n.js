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

import { defaultLanguage } from './defaults.js';
import { fetchPlaceholders, getMetadata } from './aem.js';
import { cachedFetch } from './load-resource.js';
import { replaceTextContent } from './helpers.js';

/**
 * Available languages
 *
 * @type {string[]}
 */
let availableLanguages = [defaultLanguage];

/**
 * URL list for current page in other languages
 *
 * @type {Object}
 */
let translatedCurrentPageUrlList = {};

/**
 * Get available languages
 *
 * @returns {string[]}
 */
function getAvailableLanguages() {
  return availableLanguages;
}

/**
 * Load index
 *
 * @returns {Promise}
 */
function loadIndex() {
  const currentSiteKey = getMetadata('key') || 'index';
  return cachedFetch('/query-index.json')
    .then((items) => {
      const filteredItems = items.filter((site) => site.key === currentSiteKey);
      translatedCurrentPageUrlList = filteredItems.reduce((acc, item) => {
        acc[item.lang] = item.path;
        return acc;
      }, {});
      document.dispatchEvent(new Event('changedLanguages'));
    });
}

/**
 * Set available languages
 *
 * @param {string[]} newLanguages
 */
function setAvailableLanguages(newLanguages) {
  availableLanguages = newLanguages;
  document.dispatchEvent(new Event('changedLanguages'));
  if (availableLanguages.length > 1) {
    loadIndex()
      .then();
  }
}

/**
 * Get URL for language
 *
 * @param {string} language
 * @returns {string|null}
 */
function getUrlForLanguage(language) {
  return translatedCurrentPageUrlList[language] || null;
}

/**
 * Get current language
 *
 * @returns {string}
 */
function getCurrentLanguage() {
  return getMetadata('lang') || defaultLanguage;
}

/**
 * Get current placeholder language
 *
 * @returns {string}
 */
function getCurrentPlaceholderLanguage() {
  let placeholderLanguage = getCurrentLanguage();
  if (placeholderLanguage === defaultLanguage) {
    placeholderLanguage = 'default';
  }
  return placeholderLanguage;
}

/**
 * Load placeholders
 *
 * @returns {Promise}
 */
async function loadPlaceholders() {
  return Promise.all(
    [
      fetchPlaceholders(),
      fetchPlaceholders(getCurrentPlaceholderLanguage()),
    ],
  );
}

/**
 * Get loaded placeholders
 *
 * @returns {object}
 */
function getLoadedPlaceholders() {
  if (!window.placeholders) {
    // eslint-disable-next-line no-console
    console.error('Placeholders have not been loaded yet');
    return {};
  }
  return {
    ...window.placeholders.default || {},
    ...window.placeholders[getCurrentPlaceholderLanguage()] || {},
  };
}

/**
 * Replace placeholders
 *
 * @param {String} template
 * @param {*} params
 * @returns {String}
 */
function replacePlaceholders(template, ...params) {
  return template.replace(
    /%(\d+)/g,
    (match, number) => (
      typeof params[number - 1] !== 'undefined'
        ? params[number - 1]
        : match),
  );
}

/**
 * Translate text
 *
 * @param {string} text
 * @returns {*}
 */
function getText(text) {
  return getLoadedPlaceholders()[text] || text;
}

/**
 * Translate text synchronously (loadPlaceholders MUST be executed before!)
 *
 * @param {String} text
 * @param {*} params
 * @returns {String}
 */
function ts(text, ...params) {
  return replacePlaceholders(getText(text), ...params);
}

/**
 * Set translated text content
 *
 * @param {HTMLElement} element
 * @param {String} text
 * @param {*} params
 * @returns {Promise}
 */
async function tContent(element, text, ...params) {
  replaceTextContent(element, ts(text, ...params));
  loadPlaceholders()
    .then(() => {
      replaceTextContent(element, ts(text, ...params));
    });
}

export {
  ts,
  tContent,
  loadPlaceholders,
  getCurrentLanguage,
  getUrlForLanguage,
  setAvailableLanguages,
  getAvailableLanguages,
};
