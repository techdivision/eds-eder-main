import {
  getFilterValueForElement,
  getDecorationTextValue,
} from '../filter-library.js';
import { toClassName } from '../../../scripts/aem.js';
import { isEmpty } from '../../../scripts/helpers.js';

/**
 * Build option
 *
 * @param {string} filterName
 * @param {HTMLElement} decoration
 * @returns {HTMLElement}
 */
function buildOption(filterName, decoration) {
  // get value
  const filterValue = getDecorationTextValue(decoration);

  // build ID
  const optionId = `filter--${toClassName(filterName)}--${toClassName(filterValue)}`;

  // build option
  const optionElement = document.createElement('input');
  optionElement.setAttribute('type', 'checkbox');
  optionElement.setAttribute('id', optionId);
  optionElement.setAttribute('value', filterValue);

  // build label
  const labelElement = document.createElement('label');
  labelElement.setAttribute('for', optionId);
  labelElement.append(decoration);

  // add to wrapper
  const wrapperElement = document.createElement('div');
  wrapperElement.classList.add('filter-option');
  wrapperElement.append(optionElement);
  wrapperElement.append(labelElement);
  return wrapperElement;
}

/**
 * Get selected values
 *
 * @param {NodeList} checkboxes
 * @returns {String[]}
 */
function getSelectedValues(checkboxes) {
  return [...checkboxes]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

/**
 * Check if element matches
 *
 * @param {Object} filter
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function elementMatches(filter, element) {
  const elementValue = getFilterValueForElement(element, filter.filterFields[0]);
  return isEmpty(filter.value) || filter.value.includes(elementValue);
}

/**
 * Decorate filter
 *
 * @param {HTMLElement} block
 * @param {HTMLElement} container
 * @param {Object} filter
 */
function build(block, container, filter) {
  // set filter function
  filter.elementMatches = elementMatches;

  // add options
  filter.decoration.forEach((decoration) => {
    const wrapperElement = buildOption(filter.name, decoration);
    container.append(wrapperElement);
  });

  // get all checkboxes
  const checkboxes = container.querySelectorAll('input');

  // add change event
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      // set selected option(s)
      filter.value = getSelectedValues(checkboxes);

      // re-render filters
      block.dispatchEvent(new Event('renderFilters'));
    });
  });

  // set current filter value
  if (filter.value) {
    checkboxes.forEach((checkbox) => {
      // noinspection JSUnresolvedReference
      checkbox.checked = filter.value.includes(checkbox.value);
    });
  }
}

export {
  build,
  elementMatches,
};
