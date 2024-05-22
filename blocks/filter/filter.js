import { transformRowsToData } from '../../scripts/helpers.js';
import { build as decorateSliderFilter } from './types/slider.js';
import { build as decorateDropdownFilter } from './types/dropdown.js';
import { build as decorateCheckboxFilter } from './types/checkbox.js';
import { getFilterFieldsElements } from './filter-library.js';

/**
 * Process filters
 *
 * @param {HTMLElement} block
 * @param {Array} filters
 */
function processFilters(block, filters) {
  const allFilterFields = filters.flatMap((filter) => filter.filterFields);
  const allRelevantElements = getFilterFieldsElements(allFilterFields);

  // show all
  allRelevantElements.forEach((element) => {
    element.classList.remove('hidden');
  });

  // try for all filters
  filters.forEach((filter) => {
    // filter has not been set
    if (!filter.value) {
      return;
    }

    // iterate over all relevant elements
    getFilterFieldsElements(filter.filterFields).forEach((element) => {
      // element is already hidden by another filter
      if (element.classList.contains('hidden')) {
        return;
      }

      // element is not applicable for this filter
      if (filter.elementMatches && !filter.elementMatches(filter, element)) {
        element.classList.add('hidden');
      }
    });
  });
}

/**
 * Add filters
 *
 * @param {HTMLElement} block
 * @param {Array} filters
 */
function renderFilters(block, filters) {
  block.textContent = '';
  filters.forEach((filter) => {
    const container = document.createElement('div');

    // noinspection JSUnresolvedReference
    container.classList.add(
      'filter-item',
      `filter--${filter.name}`.toLowerCase(),
      `filter-type-${filter.filterType}`.toLowerCase(),
    );
    block.append(container);

    // noinspection JSUnresolvedReference
    if (filter.filterType === 'slider') {
      decorateSliderFilter(block, container, filter);
    } else if (filter.filterType === 'dropdown') {
      decorateDropdownFilter(block, container, filter);
    } else if (filter.filterType === 'checkbox') {
      decorateCheckboxFilter(block, container, filter);
    }

    // filter elements
    processFilters(block, filters);
  });
}

/**
 * Decorate filter block
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // define headers
  const headers = {
    name: 'text',
    filterType: 'text',
    filterFields: 'options',
    decoration: 'htmlOptions',
  };

  // create filters array
  const filters = transformRowsToData(headers, block);

  // reset block
  block.textContent = '';

  // add event to render filters
  block.addEventListener('renderFilters', () => {
    renderFilters(block, filters);
  });

  // render filters only after initializing other elements
  setTimeout(() => {
    block.dispatchEvent(new Event('renderFilters'));
  }, 100);
}
