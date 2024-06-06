import { getFilterValueForElement } from '../filter-library.js';
import { isEmpty } from '../../../scripts/helpers.js';

/**
 * Build option
 *
 * @param {string} name
 * @param {string} value
 * @returns {HTMLOptionElement}
 */
function buildOption(name, value) {
  const optionElement = document.createElement('option');
  optionElement.setAttribute('value', value);
  optionElement.textContent = name;
  return optionElement;
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
  return isEmpty(filter.value)
    || isEmpty(elementValue)
    || elementValue === filter.value;
}

/**
 * Decorate filter
 *
 * @param {HTMLElement} block
 * @param {HTMLElement} container
 * @param {Object} filter
 */
function build(block, container, filter) {
  // add chevron
  container.classList.add('has-chevron', 'chevron-down');

  // set filter function
  filter.elementMatches = elementMatches;

  // get filter field
  const filterField = filter.filterFields[0];

  // build select
  const select = document.createElement('select');
  select.setAttribute('placeholder', filter.name);

  // add default option
  const defaultOptionElement = buildOption(filter.name, '');
  select.append(defaultOptionElement);

  // add options
  filter.options[filterField].forEach((option) => {
    const optionElement = buildOption(option, option);
    select.append(optionElement);
  });

  // add select
  container.append(select);

  // add change event
  select.addEventListener('change', (e) => {
    // retrieve selected option
    const selectedOption = e.target.options[e.target.selectedIndex];
    filter.value = selectedOption.getAttribute('value');

    // re-render filters
    block.dispatchEvent(new Event('change'));
  });

  // set current filter value
  if (filter.value) {
    select.value = filter.value;
  }
}

export {
  build,
  elementMatches,
};
