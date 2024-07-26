import { defaultLanguage } from './defaults.js';
import { fetchPlaceholders, getMetadata } from './aem.js';

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
    ]
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
 * Translate text
 *
 * @param {String} text
 * @param {*} params
 * @returns {Promise<String>}
 */
async function t(text, ...params) {
  await loadPlaceholders();
  return ts(text, ...params);
}

export {
  t,
  ts,
  loadPlaceholders,
  getCurrentLanguage,
};
