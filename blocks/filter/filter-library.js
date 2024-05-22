/**
 * Get filter value for element
 *
 * @param {HTMLElement} element
 * @param {string} filterField
 * @returns {string}
 */
function getFilterValueForElement(element, filterField) {
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
 * Get filter fields elements
 *
 * @param {Array|String} filterFields
 * @returns {NodeListOf<*>}
 */
function getFilterFieldsElements(filterFields) {
  const selector = ([].concat(filterFields)).map((field) => `[data-${field}]`).join(', ');
  return document.querySelectorAll(selector);
}

/**
 * Retrieve options for filter field
 *
 * @param {String|Array} filterField
 * @param {boolean} [onlyVisible]
 * @returns {Array}
 */
function retrieveOptionsForFilterField(filterField, onlyVisible) {
  const elements = getFilterFieldsElements([].concat(filterField));
  let values = new Set(); // using a set to automatically handle uniqueness

  elements.forEach((element) => {
    ([].concat(filterField)).forEach((singleFilterField) => {
      const value = getFilterValueForElement(element, singleFilterField);
      if (value && (!onlyVisible || !element.classList.contains('hidden'))) {
        values.add(value);
      }
    });
  });
  values = Array.from(values);

  // numeric sort
  if (values.every((value) => !Number.isNaN(Number(value)))) {
    return values.map(Number).sort((a, b) => a - b);
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
  getFilterFieldsElements,
  getDecorationTextValue,
};
