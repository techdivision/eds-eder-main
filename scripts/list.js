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

import { getCurrentUrl, getUrlParam, setUrlParam } from './helpers.js';
import { loadPlaceholders, tContent, ts } from './i18n.js';
import { getTenants, getTenantUrl } from './tenants.js';
import { defaultTenant, queryParamPage } from './defaults.js';
import { cachedFetch } from './load-resource.js';

/**
 * Get current page
 *
 * @returns {Number}
 */
function getCurrentPage() {
  return Number(getUrlParam(queryParamPage)) || 1;
}

/**
 * Set current page
 *
 * @param {Number} page
 */
function setCurrentPage(page) {
  let actualPage = page;
  if (Number.isNaN(page) || page < 2) {
    actualPage = null;
  }
  setUrlParam(queryParamPage, actualPage);
}

/**
 * Get filter block
 *
 * @param {HTMLElement} referenceElement
 * @returns {Element}
 */
function getFilterBlock(referenceElement) {
  // define scope
  let scope = document;
  const currentSection = referenceElement.closest('.section');
  if (currentSection) {
    scope = currentSection;
  }

  // get filter block
  return scope.querySelector('.filter.block');
}

/**
 * Get filtered items
 *
 * @param {Array} items
 * @returns {Array}
 */
function getFilteredItems(items) {
  return items.filter(
    (item) => item.matches === undefined || item.matches === true,
  );
}

/**
 * Create pagination link
 *
 * @param {String|Number} page
 * @param {String} [label]
 * @returns {HTMLAnchorElement}
 */
function createPaginationLink(page, label) {
  const newUrl = new URL(getCurrentUrl());
  const link = document.createElement('a');
  newUrl.searchParams.set('page', page);
  link.href = newUrl.toString();
  link.setAttribute('data-page', page);
  link.innerText = label || page;
  return link;
}

/**
 * Create pagination list item
 *
 * @param {String|Number} page
 * @param {String} [label]
 * @returns {HTMLElement}
 */
function createPaginationListItem(page, label) {
  const li = document.createElement('li');
  li.classList.add('contains-link');
  li.append(createPaginationLink(page, label));
  return li;
}

/**
 * Render pagination
 *
 * @param {HTMLElement} container
 * @param {Array} items
 * @param {Number|String} page
 * @param {Number|String} limit
 * @returns {Promise}
 */
async function renderPagination(container, items, page, limit) {
  // ensure placeholders have been loaded
  await loadPlaceholders();

  // find filter block
  const filterBlock = getFilterBlock(container);

  // get filtered items
  const filteredItems = getFilteredItems(items);

  // create element
  const listPagination = document.createElement('div');
  listPagination.classList.add('pagination');

  // check limit
  if (!limit || filteredItems.length <= limit) {
    return null;
  }

  // calculate page number
  const maxPages = Math.ceil(filteredItems.length / limit);

  const list = document.createElement('ol');
  if (page > 1) {
    list.append(createPaginationListItem(page - 1, ts('Previous')));
    list.append(createPaginationListItem(1));
  }
  if (page > 3) {
    const dots = document.createElement('li');
    dots.innerText = '...';
    list.append(dots);
  }
  if (page === maxPages && maxPages > 3) {
    list.append(createPaginationListItem(page - 2));
  }
  if (page > 2) {
    list.append(createPaginationListItem(page - 1));
  }

  const currentPage = document.createElement('li');
  currentPage.classList.add('current');
  currentPage.innerText = page;
  list.append(currentPage);

  if (page < maxPages - 1) {
    list.append(createPaginationListItem(page + 1));
  }
  if (page === 1 && maxPages > 3) {
    list.append(createPaginationListItem(page + 2));
  }
  if (page + 2 < maxPages) {
    const dots = document.createElement('li');
    dots.innerText = '...';
    list.append(dots);
  }
  if (page < maxPages) {
    list.append(createPaginationListItem(maxPages));
    list.append(createPaginationListItem(page + 1, ts('Next')));
  }

  // add list page links
  const listPageLinks = document.createElement('div');
  listPageLinks.classList.add('pages');
  listPageLinks.append(list);

  // add list size
  const listSize = document.createElement('div');
  listSize.classList.add('size');
  listSize.textContent = ts('Page %1 of %2', page, maxPages);
  listPagination.append(listSize, listPageLinks);

  // add click event
  listPagination.addEventListener('click', (event) => {
    const dataPage = event.target.getAttribute('data-page');
    if (dataPage) {
      setCurrentPage(dataPage);
      if (filterBlock) {
        filterBlock.dispatchEvent(new Event('renderFilters'));
      } else {
        container.dispatchEvent(new Event('pageChanged'));
      }
      event.preventDefault();
    }
  });
  return listPagination;
}

/**
 * Get items for current page
 *
 * @param {Array} items
 * @param {Number} itemsPerPage
 * @returns {*}
 */
function getItemsForCurrentPage(items, itemsPerPage) {
  // get current page from URL parameter
  const currentPage = getCurrentPage();

  // calculate items for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
}

/**
 * Sort items
 *
 * @param {Array} items
 * @returns {Array}
 */
function sortItems(items) {
  // check for fields to check for sorting
  const fieldsToSort = [
    'endDate',
    'startDate',
    'publishDate',
    'lastModified',
  ];

  // get first available date
  function getFirstAvailableDate(item) {
    for (let i = 0; i < fieldsToSort.length; i += 1) {
      const field = fieldsToSort[i];
      if (item[field]) {
        return item[field];
      }
    }
    return null;
  }

  // sort items
  items.sort((a, b) => {
    const dateA = getFirstAvailableDate(a);
    const dateB = getFirstAvailableDate(b);

    if (dateA && dateB) {
      if (dateA < dateB) return 1;
      if (dateA > dateB) return -1;
    } else if (dateA) {
      return -1;
    } else if (dateB) {
      return 1;
    }
    return 0;
  });

  return items;
}

/**
 * Fetch list items
 *
 * @param {String} listType
 * @param {String} [baseUrl]
 * @returns {Promise}
 */
async function fetchListItems(listType, baseUrl) {
  return cachedFetch(`${baseUrl || '/'}query-index-${listType}.json`)
    // do not add calculation errors
    .then((items) => items.filter((item) => item.path && item.path !== '#CALC!'))
    .then((items) => items.map((item) => {
      Object.keys(item)
        .forEach((key) => {
          if (item[key] === '0') {
            item[key] = null;
          }
        });
      return item;
    }))
    .then(sortItems);
}

/**
 * Fetch list items for tenant
 *
 * @param {String} listType
 * @param {String} tenant
 * @returns {Promise}
 */
async function fetchListItemsForTenant(listType, tenant) {
  // add base url
  return fetchListItems(listType, getTenantUrl(tenant))
    .then((tenantItems) => tenantItems.map((item) => ({
      ...item,
      path: getTenantUrl(tenant, item.path),
      image: getTenantUrl(tenant, item.image),
    })));
}

/**
 * Fetch list items from given tenants
 *
 * @param {String} listType
 * @param {Array} tenants
 * @param {Array} [preloadedItems]
 * @returns {Promise<Array>}
 */
async function fetchTenantsListItems(listType, tenants, preloadedItems) {
  let items = preloadedItems || [];
  const tenantPromises = tenants
    .map((tenant) => fetchListItemsForTenant(listType, tenant)
      .then((tenantItems) => {
        // add to list
        items = items.concat(tenantItems);
      }));

  // sort accumulated items
  return Promise.allSettled(tenantPromises)
    .then(() => sortItems(items));
}

/**
 * Render placeholders
 *
 * @param {HTMLElement} container
 * @param {function} renderer
 * @param {Number|String} limit
 * @returns {void}
 */
function renderPlaceholders(container, renderer, limit) {
  container.innerHTML = '';
  const items = Array.from({ length: limit }, () => ({}));
  items.forEach((item) => {
    const placeholder = renderer(item);
    placeholder.classList.add('placeholder');
    container.append(placeholder);
  });
}

/**
 * Render list
 *
 * @param {HTMLElement} container
 * @param {function} renderer
 * @param {Array} items
 * @param {Number|String} limit
 * @returns {Promise<void>}
 */
async function renderList(container, renderer, items, limit) {
  // get pagination
  await loadPlaceholders();
  const pagination = await renderPagination(container, items, getCurrentPage(), limit);

  // get items for current page
  let relevantItems = getFilteredItems(items);
  if (pagination) {
    relevantItems = getItemsForCurrentPage(relevantItems, limit);
  }

  // build HTML
  relevantItems.forEach((item) => {
    if (!item.renderedHtml) {
      item.renderedHtml = renderer(item);
    }
  });

  // render
  container.innerHTML = '';
  if (pagination) {
    container.append(pagination);
  }
  if (relevantItems.length) {
    relevantItems.forEach((item) => {
      container.append(item.renderedHtml);
    });
  } else {
    const p = document.createElement('p');
    p.classList.add('no-results');
    tContent(p, 'No results match your selection.')
      .then();
    container.append(p);
  }
}

/**
 * Decorate list
 *
 * @param {HTMLElement} container
 * @param {Object|{renderCallback: function, amount: string, limit: string, classes: Array}} config
 * @param {string} listType
 * @param {Function} renderer
 * @param {Function} [itemManipulator]
 * @returns {Promise<void>}
 */
async function decorateList(container, config, listType, renderer, itemManipulator) {
  // get config
  const amount = Number.parseInt(config.amount, 10) || 0;
  const limit = Number.parseInt(config.limit, 10) || 10;

  // render placeholders to prevent layout shifts
  renderPlaceholders(container, renderer, amount || limit);

  // ensure placeholders have been loaded
  await loadPlaceholders();

  // get items
  let items = [];
  if (config.classes && config.classes.includes('all')) {
    items = await fetchTenantsListItems(listType, getTenants());
  } else if (config.classes && config.classes.includes('with-global')) {
    items = await fetchTenantsListItems(
      listType,
      [defaultTenant],
      await fetchListItems(listType),
    );
  } else {
    items = await fetchListItems(listType);
  }

  // manipulate items
  if (itemManipulator) {
    items = itemManipulator(items);
  }

  // set maximum amount
  if (amount >= 1) {
    items = items.slice(0, amount);
  }

  // define renderer
  const listRenderer = async () => {
    await renderList(container, renderer, items, limit);
    if (config.renderCallback) {
      config.renderCallback();
    }
  };

  // set filter items
  const filterBlock = getFilterBlock(container);
  if (filterBlock) {
    // set items to be filtered
    filterBlock.filterItems = items;

    // when we process filters, the items and pagination need to be re-drawn
    filterBlock.addEventListener('filtersProcessed', listRenderer);
    filterBlock.dispatchEvent(new Event('renderFilters'));
  } else {
    // when we change the page, the list should be updated even if no filters are present
    container.addEventListener('pageChanged', listRenderer);
    container.dispatchEvent(new Event('pageChanged'));
  }
}

export {
  getCurrentPage,
  setCurrentPage,
  getItemsForCurrentPage,
  fetchListItems,
  fetchTenantsListItems,
  getFilterBlock,
  renderPlaceholders,
  renderList,
  decorateList,
};
