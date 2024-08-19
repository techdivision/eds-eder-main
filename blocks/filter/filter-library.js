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

/**
 * Get filter value for element
 *
 * @param {HTMLElement|Object} element
 * @param {string} filterField
 * @returns {string}
 */
function getFilterValueForElement(element, filterField) {
  if (!(element instanceof HTMLElement)) {
    return element[filterField];
  }
  return element.getAttribute(`data-${filterField}`);
}

/**
 * Get numeric filter value for element
 *
 * @param {HTMLElement} element
 * @param {string} filterField
 * @returns {int}
 */
function getNumericFilterValueForElement(element, filterField) {
  return parseInt(getFilterValueForElement(element, filterField), 10);
}

/**
 * Get all months as strings
 *
 * @param {string} locale
 * @param {string} format
 * @returns {string[]}
 */
function getAllMonths({
  locale = navigator.language,
  format = 'long',
} = {}) {
  // noinspection JSCheckFunctionSignatures
  const applyFormat = new Intl.DateTimeFormat(locale, { month: format }).format;
  return [...Array(12)
    .keys()].map((m) => applyFormat(new Date(2021, m)));
}

/**
 * Retrieve options for filter field
 *
 * @param {Object} filter
 * @param {String} filterField
 * @returns {Array}
 */
function retrieveOptionsForFilterField(filter, filterField) {
  let values = new Set(); // using a set to automatically handle uniqueness

  // retrieve all options
  filter.elements.forEach((element) => {
    const value = getFilterValueForElement(element, filterField);
    if (value) {
      values.add(value);
    }
  });
  values = Array.from(values);

  // apply numeric sort if all values are numeric
  if (values.every((value) => !Number.isNaN(Number(value)))) {
    return values.map(Number)
      .sort((a, b) => a - b);
  }

  // apply date sort if all values are dates
  const monthIndexMap = getAllMonths()
    .reduce((acc, month, index) => {
      acc[month] = index;
      return acc;
    }, {});
  const toDate = (dateString) => {
    const [monthName, year] = dateString.split(' ');
    const monthIndex = monthIndexMap[monthName];
    return new Date(year, monthIndex);
  };
  const allDates = values.every((value) => !Number.isNaN(Date.parse(value)));
  if (allDates) {
    return values.sort((a, b) => toDate(a) + toDate(b));
  }

  // standard sort
  return values.sort();
}

/**
 * Get text value from decoration node
 *
 * @param {HTMLElement} decoration
 * @returns {string}
 */
function getDecorationTextValue(decoration) {
  if (decoration.nodeName.toLowerCase() === 'picture') {
    return decoration.querySelector('img').alt;
  }
  return decoration.textContent;
}

export {
  getNumericFilterValueForElement,
  getFilterValueForElement,
  retrieveOptionsForFilterField,
  getDecorationTextValue,
};
