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

import { defaultDateTimeLocale } from './defaults.js';

/**
 * Get metadata attribute names from metadata row
 *
 * @param {HTMLElement} row
 * @returns {Array}
 */
function getMetadataAttributeNames(row) {
  // store attribute names
  const attributeNames = [];
  let isInvalid = false;

  // iterate over columns
  [...row.children].forEach((column, columnIndex) => {
    // default value
    attributeNames[columnIndex] = null;

    // iterate over elements
    const columnElements = column.children;
    if (columnElements.length) {
      [...columnElements].forEach((element) => {
        if (element.tagName.toLowerCase() !== 'p') {
          isInvalid = true;
          return;
        }
        attributeNames[columnIndex] = element.textContent;
      });
    }
  });

  // return empty array if all elements are null
  return isInvalid || attributeNames.every((element) => element === null) ? [] : attributeNames;
}

/**
 * Transform metadata block's metadata row to metadata attributes
 *
 * @param {HTMLElement} block
 */
function transformToMetadata(block) {
  // check if a metadata row exists and extract attribute names
  const metadataRow = block.firstElementChild;
  const metadataAttributeNames = getMetadataAttributeNames(metadataRow);
  if (!metadataAttributeNames.length) {
    return;
  }

  // remove first row
  metadataRow.remove();

  // iterate over rows and columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((column, columnIndex) => {
      const isMetadataColumn = metadataAttributeNames[columnIndex] !== null;
      if (isMetadataColumn) {
        // remove whitespaces from attribute name
        const cleanName = metadataAttributeNames[columnIndex].replace(/\s/g, '');
        row.setAttribute(`data-${cleanName}`, column.textContent);
        column.remove();
      }
    });
  });
}

/**
 * Transform rows to data
 *
 * @param {Array|Object} keys
 * @param {HTMLElement} block
 * @returns {Array}
 */
function transformRowsToData(keys, block) {
  const data = [];
  let keyArray;
  let keyConfiguration;
  if (typeof (keys) === 'object') {
    keyArray = Object.keys(keys);
    keyConfiguration = keys;
  } else {
    keyArray = keys;
    keyConfiguration = {};
  }

  // iterate over rows
  [...block.children].forEach((row) => {
    const entry = {};
    // iterate over columns
    [...row.children].forEach((column, columnIndex) => {
      // check if the column is relevant
      const key = keyArray[columnIndex];
      if (key === null) {
        return;
      }
      // set data
      let content = column.textContent.trim();
      if (keyConfiguration[key] === 'options') {
        content = column.textContent.trim()
          .split(',')
          .map((contentItem) => contentItem.replace(/\s/g, ''));
      } else if (keyConfiguration[key] === 'htmlOptions') {
        content = Array.from(column.querySelectorAll('*:not(:has(*)):not(img,source), picture'));
      }
      entry[keyArray[columnIndex]] = content;
    });
    data.push(entry);
    row.remove();
  });

  return data;
}

/**
 * Copy attributes
 *
 * @param {HTMLElement} elementSrc
 * @param {HTMLElement} elementDest
 */
function copyAttributes(elementSrc, elementDest) {
  [...elementSrc.attributes].forEach((attribute) => {
    elementDest.setAttribute(attribute.name, attribute.value);
  });
}

/**
 * Check if variable is empty
 *
 * @param {*} check
 * @returns {boolean}
 */
function isEmpty(check) {
  return check == null
    || (typeof check === 'string' && !check.trim())
    || (Array.isArray(check) && !check.length);
}

/**
 * Check for library mode
 *
 * @returns {boolean}
 */
function isLibraryMode() {
  return window.location.href === 'about:srcdoc';
}

/**
 * Get current URL
 *
 * @returns {string}
 */
function getCurrentUrl() {
  if (isLibraryMode()) {
    return window.parent && window.parent.document
      ? window.parent.document.URL
      : 'https://www.google.de/';
  }
  return window.location.href;
}

/**
 * Get TLD
 *
 * @param {string} [url]
 * @returns {string}
 */
function getTLD(url) {
  return new URL(typeof (url) === 'undefined' ? getCurrentUrl() : url).hostname.split(/\./)
    .slice(-2)
    .join('.');
}

/**
 * Check if we are local
 *
 * @returns {boolean}
 */
function isLocal() {
  return getTLD() === 'localhost';
}

/**
 * Check if we are on the test system
 *
 * @returns {boolean}
 */
function isTest() {
  return ['hlx.page', 'aem.page'].includes(getTLD());
}

/**
 * Check if we have a specific URL Param
 *
 * @param {string} field
 * @returns {boolean}
 */
function hasUrlParam(field) {
  return new URLSearchParams(window.location.search).has(field);
}

/**
 * Get URL Param
 *
 * @param {string} field
 * @returns {string}
 */
function getUrlParam(field) {
  return new URLSearchParams(window.location.search).get(field) || '';
}

/**
 * Set URL param
 *
 * @param param
 * @param value
 */
function setUrlParam(param, value) {
  const url = new URL(getCurrentUrl());
  if (isEmpty(value)) {
    url.searchParams.delete(param);
  } else {
    url.searchParams.set(param, Array.isArray(value) ? value.join(',') : value);
  }

  try {
    window.history.replaceState({}, '', url);
  } catch (e) {
    // history is not available in library
  }
}

/**
 * Convert excel date
 * @param {string|Number} excelDate
 * @returns {Date}
 */
function convertDate(excelDate) {
  return new Date(Number(excelDate) * 1000);
}

/**
 * Get readable date
 *
 * @param {String|Date} inputDate
 * @param {Object} [format]
 * @returns {string|null}
 */
function getReadableDate(inputDate, format) {
  const date = new Date(inputDate)
    .toLocaleDateString(
      defaultDateTimeLocale,
      format || {
        dateStyle: 'medium',
      },
    );
  if (date === 'Invalid Date') {
    return null;
  }
  return date;
}

/**
 * Add body class
 *
 * @param {String} classes
 */
function addBodyClass(...classes) {
  document.body.classList.add(...classes);
}

/**
 * Check for body class
 *
 * @param {String} className
 * @returns {boolean}
 */
function hasBodyClass(className) {
  return document.body.classList.contains(className);
}

/**
 * Check if block is filterable
 *
 * @returns {boolean}
 */
function isFilterable(block) {
  return block.classList.contains('filterable');
}

/**
 * Wrap all images with one div
 *
 * @param scope
 */
function wrapImages(scope) {
  const images = scope.querySelectorAll('picture');
  if (images.length > 0) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'image-wrapper';

    images.forEach((img) => {
      const parent = img.closest('p');
      if (parent) {
        imgWrapper.append(parent);
      }
    });

    scope.append(imgWrapper);
  }
}

/**
 * Replace whitespaces with any other char
 * @param string
 * @param replaceChar
 * @returns {*}
 */
function replaceWhitespaces(string, replaceChar) {
  return string.replace(/\s/g, replaceChar);
}

/**
 * Normalizes string
 *
 * @param str
 * @returns {*}
 */
function normalize(str) {
  const combining = /[\u0300-\u036F]/g;
  return str.normalize('NFKD')
    .replace(combining, '')
    .replace('ß', 'ss');
}

/**
 * Replace text content
 *
 * @param {HTMLElement} element
 * @param {string} text
 */
function replaceTextContent(element, text) {
  let textNode = null;
  for (let i = 0; i < element.childNodes.length; i += 1) {
    if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
      textNode = element.childNodes[i];
      break;
    }
  }

  // if a text node exists, replace its content; otherwise, create a new text node
  if (textNode) {
    textNode.textContent = text;
  } else {
    textNode = document.createTextNode(text);
    element.appendChild(textNode);
  }
}

/**
 * Parse date
 *
 * @param input
 * @returns {Date}
 */
function parseDate(input) {
  const parts = input.match(/(\d+)/g);

  // note parts[1]-1
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

/**
 * Get name of weekday
 *
 * @param {Date} date
 * @returns {string}
 */
function getDayName(date) {
  return parseDate(date)
    .toLocaleDateString(defaultDateTimeLocale, { weekday: 'long' });
}

/**
 * Get time as string
 *
 * @param input
 * @returns {string}
 */
function getTime(input) {
  const parts = input.match(/(\d+)/g);

  return `${parts[3]}:${parts[4]}`;
}

/**
 * Set images to load as LCP
 *
 * @param {HTMLElement} parent
 */
function lcpImages(parent) {
  parent.querySelectorAll('img')
    .forEach((img) => {
      img.setAttribute('loading', 'eager');
    });
}

/**
 * Execute functions based on a breakpoint
 *
 * @param {function} mobileExecutor
 * @param {function} desktopExecutor
 * @param {int} [breakpoint]
 * @returns {MediaQueryList}
 */
function executeOnBreakpoint(mobileExecutor, desktopExecutor, breakpoint) {
  // define basic executor
  const executor = (event) => {
    if (event.matches) {
      desktopExecutor();
    } else {
      mobileExecutor();
    }
  };

  // execute and add listener
  const mql = window.matchMedia(`(width >= ${breakpoint || 900}px)`);
  mql.addEventListener('change', executor);
  executor(mql);
  return mql;
}

// export
export {
  isEmpty,
  copyAttributes,
  transformRowsToData,
  transformToMetadata,
  hasUrlParam,
  getUrlParam,
  setUrlParam,
  getCurrentUrl,
  getTLD,
  isLocal,
  isTest,
  convertDate,
  getReadableDate,
  addBodyClass,
  replaceTextContent,
  isFilterable,
  wrapImages,
  replaceWhitespaces,
  normalize,
  hasBodyClass,
  getDayName,
  getTime,
  lcpImages,
  executeOnBreakpoint,
};
