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

// export
export {
  isEmpty,
  copyAttributes,
  transformRowsToData,
  transformToMetadata,
  getUrlParam,
  setUrlParam,
  getCurrentUrl,
  convertDate,
  getReadableDate,
};
