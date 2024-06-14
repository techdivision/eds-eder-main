import { defaultLanguage } from './defaults.js';
import { fetchPlaceholders, getMetadata, toCamelCase } from './aem.js';

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
 * @returns {Promise<void>}
 */
async function loadPlaceholders() {
  await fetchPlaceholders();
  await fetchPlaceholders(getCurrentPlaceholderLanguage());
}

/**
 * Get loaded placeholders
 *
 * @returns {object}
 */
function getLoadedPlaceholders() {
  if (!window.placeholders) {
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
  // set to camel case (see aem.js:550)
  return getLoadedPlaceholders()[toCamelCase(text)] || text;
}

/**
 * Translate text synchronously (loadPlaceholders MUST be executed before!)
 *
 * @param {String} text
 * @param {*} params
 * @returns {String}
 */
function tSync(text, ...params) {
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
  return tSync(text, ...params);
}

export {
  t,
  tSync,
  loadPlaceholders,
  getCurrentLanguage,
};
