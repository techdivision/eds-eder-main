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
