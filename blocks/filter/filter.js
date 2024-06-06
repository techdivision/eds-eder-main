// noinspection JSUnresolvedReference

import { getUrlParam, isEmpty, setUrlParam, transformRowsToData, } from '../../scripts/helpers.js';
import { build as decorateSliderFilter } from './types/slider.js';
import { build as decorateDropdownFilter } from './types/dropdown.js';
import { build as decorateCheckboxFilter } from './types/checkbox.js';
import { retrieveOptionsForFilterField } from './filter-library.js';
import { setCurrentPage } from '../../scripts/list.js';

/**
 * Process filters
 *
 * @param {HTMLElement} block
 * @param {Array} filters
 */
function processFilters(block, filters) {
  // re-set matching state
  block.filterItems.forEach((element) => {
    element.matches = true;
  });

  // try for all filters
  filters.forEach((filter) => {
    // filter has not been set
    if (!filter.value || !filter.elements) {
      return;
    }

    // iterate over all relevant elements
    [...filter.elements].forEach((element) => {
      // element was not matched by a previous filter
      if (!element.matches) {
        return;
      }

      // element is not applicable for this filter
      if (filter.elementMatches && !filter.elementMatches(filter, element)) {
        element.matches = false;
      }
    });
  });
}

/**
 * Handle HTML elements visibility
 *
 * @param {HTMLElement} block
 */
function handleHtmlElementsVisibility(block) {
  block.filterItems.forEach((element) => {
    if (element instanceof HTMLElement) {
      element.classList.toggle('hidden', !element.matches);
    }
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
    // add elements
    filter.elements = block.filterItems;
    filter.options = {};
    filter.filterFields.forEach((filterField) => {
      filter.options[filterField] = retrieveOptionsForFilterField(
        filter,
        filterField,
      );
    });

    // build container
    const container = document.createElement('div');
    container.classList.add(
      'filter-item',
      `filter--${filter.name}`.toLowerCase(),
      `filter-type-${filter.filterType}`.toLowerCase(),
    );
    block.append(container);

    // build by filter type
    if (filter.filterType === 'slider') {
      decorateSliderFilter(block, container, filter);
    } else if (filter.filterType === 'dropdown') {
      decorateDropdownFilter(block, container, filter);
    } else if (filter.filterType === 'checkbox') {
      decorateCheckboxFilter(block, container, filter);
    }

    // filter elements
    block.dispatchEvent(new Event('processFilters'));
  });
}

/**
 * Retrieve filter elements
 *
 * @returns {Array|NodeList}
 */
function retrieveFilterItems(filters) {
  // retrieve by filter fields
  const allFilterFields = filters.flatMap((filter) => filter.filterFields);
  return document.querySelectorAll(
    allFilterFields.map((field) => `[data-${field}]`)
      .join(', '),
  );
}

/**
 * Set initial filters state
 *
 * @param {Array} filters
 */
function setInitialState(filters) {
  filters.forEach((filter) => {
    // get values from URL
    const urlValues = filter.filterFields.map((filterField) => {
      let valueFromUrl = getUrlParam(filterField);
      if (valueFromUrl.includes(',')) {
        valueFromUrl = valueFromUrl.split(',');
      }
      return isEmpty(valueFromUrl) ? null : valueFromUrl;
    });

    // set filter value
    if (!urlValues.every((value) => value === null)) {
      filter.value = filter.filterFields.length > 1 ? urlValues : urlValues[0];
    }
  });
}

/**
 * Save state
 *
 * @param {Array} filters
 */
function saveState(filters) {
  filters.forEach((filter) => {
    filter.filterFields.forEach((filterField, index) => {
      let valueToSave;
      if (filter.filterFields.length > 1 && filter.value) {
        valueToSave = filter.value[index];
      } else {
        valueToSave = filter.value;
      }

      setUrlParam(filterField, valueToSave);
    });
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
  setInitialState(filters);

  // reset block
  block.textContent = '';

  // add event to render filters
  block.addEventListener('renderFilters', () => {
    renderFilters(block, filters);
  });
  block.addEventListener('change', () => {
    setCurrentPage(null); // reset page number
    block.dispatchEvent(new Event('renderFilters'));
  });
  block.addEventListener('processFilters', () => {
    processFilters(block, filters);
    handleHtmlElementsVisibility(block);
    saveState(filters);
    block.dispatchEvent(new Event('filtersProcessed'));
  });

  // render filters only after initializing other elements
  setTimeout(() => {
    if (!block.filterItems) {
      const filterItems = retrieveFilterItems(filters);
      if (filterItems) {
        block.filterItems = filterItems;
      }
    }
    block.dispatchEvent(new Event('renderFilters'));
  }, 100);
}
