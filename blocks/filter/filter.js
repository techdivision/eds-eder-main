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

import {
  getUrlParam,
  isEmpty,
  replaceWhitespaces,
  setUrlParam,
  transformRowsToData,
} from '../../scripts/helpers.js';
import { build as decorateSliderFilter } from './types/slider.js';
import { build as decorateDropdownFilter } from './types/dropdown.js';
import { build as decorateCheckboxFilter } from './types/checkbox.js';
import { retrieveOptionsForFilterField } from './filter-library.js';
import { setCurrentPage } from '../../scripts/list.js';
import { tContent } from '../../scripts/i18n.js';

/**
 * Process filters
 *
 * @param {HTMLElement & {filterItems: Array}} block
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
 * @param {HTMLElement & {filterItems: Array}} block
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
 * @param {HTMLElement & {filterItems: Array}} block
 * @param {Array} filters
 */
function renderFilters(block, filters) {
  // remove block content
  block.textContent = '';

  // add filter label
  const label = document.createElement('span');
  label.classList.add('filter-label', 'filter-item');
  tContent(label, 'Filter by:')
    .then();
  block.append(label);

  // process filters
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
 * @param {HTMLElement} block
 * @param {Array} filters
 * @returns {Array|NodeList}
 */
function retrieveFilterItems(block, filters) {
  // define scope
  let scope = document;
  const currentSection = block.closest('.section');
  if (currentSection) {
    scope = currentSection;
  }

  // retrieve by filter fields
  const allFilterFields = filters.flatMap((filter) => filter.filterFields);
  const fields = allFilterFields.map((field) => {
    // remove whitespaces from field
    const cleanField = replaceWhitespaces(field, '');
    return `[data-${cleanField}]`;
  })
    .join(', ');
  return scope.querySelectorAll(fields);
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
 * Initialize block
 *
 * @param {HTMLElement & {filterItems: Array}} block
 * @param {Array} filters
 */
function initializeBlock(block, filters) {
  if (!block.filterItems || !block.filterItems.length) {
    const filterItems = retrieveFilterItems(block, filters);
    if (filterItems) {
      block.filterItems = filterItems;
    }
  }
  block.dispatchEvent(new Event('renderFilters'));
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
  initializeBlock(block, filters);

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

  // initialize block after rendering all other elements
  setTimeout(() => {
    initializeBlock(block, filters);
  }, 200);
}
