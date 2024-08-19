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

import { getCurrentUrl } from '../helpers.js';
import { defaultLanguage, queryParamPage, queryParamSearch } from '../defaults.js';
import { getAvailableLanguages, getCurrentLanguage, getUrlForLanguage } from '../i18n.js';

/**
 * Set query parameters
 *
 * @param {URL} url
 * @returns {URL}
 */
function setAllowedQueryParameters(url) {
  // define parameter whitelist
  const whitelist = [
    queryParamPage,
    queryParamSearch,
  ];

  // add allowed parameters
  const params = new URLSearchParams(new URL(getCurrentUrl()).search);
  const newParams = new URLSearchParams();
  whitelist.forEach((param) => {
    if (params.has(param)) {
      newParams.set(param, params.get(param));
    }
  });

  // return URL
  url.search = newParams.toString();
  return url;
}

/**
 * Get canonical URL
 *
 * @returns {string}
 */
function getCanonicalUrl() {
  const url = new URL(getCurrentUrl());
  url.search = '';
  return setAllowedQueryParameters(url)
    .toString();
}

/**
 * Get href lang URL
 *
 * @param {string} [lang]
 * @returns {string|null}
 */
function getHrefLangUrl(lang) {
  const realLang = lang === 'x-default' || !lang ? defaultLanguage : lang;
  const currentLang = getCurrentLanguage();

  // check for current language
  if (realLang === currentLang) {
    return getCanonicalUrl();
  }

  // generate URL
  const path = getUrlForLanguage(realLang);
  if (!path) {
    return null;
  }

  return setAllowedQueryParameters(
    new URL(path, getCurrentUrl()),
  )
    .toString();
}

/**
 * Remove duplicate link
 *
 * @param {string} rel
 * @param {Object} [attrs] additional optional attributes
 */
function removeDuplicateLink(rel, attrs) {
  const linkSelector = `link[rel='${rel}']`;
  const attrSelectors = Object.entries(attrs || {})
    .map(([key, value]) => `[${key}='${value}']`)
    .join('');

  const link = document.querySelector(linkSelector + attrSelectors);
  if (link) {
    link.parentNode.removeChild(link);
  }
}

/**
 * Create link element
 *
 * @param {string} rel
 * @param {string} href
 * @param {Object} [attrs] additional optional attributes
 * @returns {HTMLLinkElement|null}
 */
function createLinkElement(rel, href, attrs) {
  if (!href) {
    return null;
  }
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const attr in attrs) {
    link.setAttribute(attr, attrs[attr]);
  }
  return link;
}

/**
 * add link element
 *
 * @param {string} rel
 * @param {string} href
 * @param {Object} [attrs] additional optional attributes
 * @returns {HTMLLinkElement|null}
 */
function addLinkElement(rel, href, attrs) {
  const link = createLinkElement(
    rel,
    href,
    attrs,
  );
  removeDuplicateLink(rel, attrs);
  if (link) {
    document.head.append(link);
  }
}

/**
 * Get href lang code
 *
 * @param {string} lang
 * @returns {string}
 */
function getHrefLangCode(lang) {
  const mapping = {
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
  };
  return mapping[lang] || lang;
}

/**
 * Render canonical tags
 */
function renderCanonical() {
  if (window.errorCode && window.errorCode === '404') {
    return;
  }
  addLinkElement('canonical', getCanonicalUrl());
}

/**
 * Render href lang tags
 */
function renderHrefLang() {
  if (window.errorCode && window.errorCode === '404') {
    return;
  }

  addLinkElement(
    'alternate',
    getHrefLangUrl('x-default'),
    { hreflang: 'x-default' },
  );

  getAvailableLanguages()
    .forEach((lang) => {
      addLinkElement(
        'alternate',
        getHrefLangUrl(lang),
        { hreflang: getHrefLangCode(lang) },
      );
    });
}

export {
  renderHrefLang,
  renderCanonical,
};
