import ffetch from './vendor/ffetch.js';
import { getCurrentUrl, getUrlParam, setUrlParam } from './helpers.js';
import { loadPlaceholders, ts } from './i18n.js';
import { getTenants, getTenantUrl } from './tenants.js';
import { readBlockConfig } from './aem.js';
import { defaultTenant } from './defaults.js';

/**
 * Get current page
 *
 * @returns {Number}
 */
function getCurrentPage() {
  return Number(getUrlParam('page')) || 1;
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
  setUrlParam('page', actualPage);
}

/**
 * Get filter block
 *
 * @param {HTMLElement} block
 * @returns {Element}
 */
function getFilterBlock(block) {
  // define scope
  let scope = document;
  const currentSection = block.closest('.section');
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
 * @param {HTMLElement} block
 * @param {Array} items
 * @param {Number|String} page
 * @param {Number|String} limit
 * @returns {Promise}
 */
async function renderPagination(block, items, page, limit) {
  // ensure placeholders have been loaded
  await loadPlaceholders();

  // find filter block
  const filterBlock = getFilterBlock(block);

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
        block.dispatchEvent(new Event('pageChanged'));
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
  // retrieve items that match for current filter set
  const filteredItems = getFilteredItems(items);

  // get current page from URL parameter
  const currentPage = getCurrentPage();

  // calculate items for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredItems.slice(startIndex, endIndex);
}

/**
 * Sort items
 *
 * @param {Array} items
 * @returns {Array}
 */
function sortItems(items) {
  items.sort((a, b) => b.lastModified - a.lastModified);
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
  return ffetch(`${baseUrl || '/'}query-index-${listType}.json`)
    .all()
    // do not add calculation errors
    .then((items) => items.filter((item) => item.path && item.path !== '#CALC!'))
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

  // sort accumulated items by lastModified
  return Promise.allSettled(tenantPromises)
    .then(() => sortItems(items));
}

/**
 * Render placeholders
 *
 * @param {HTMLElement} block
 * @param {function} renderer
 * @param {Number|String} limit
 * @returns {void}
 */
function renderPlaceholders(block, renderer, limit) {
  block.innerHTML = '';
  const items = Array.from({ length: limit }, () => ({}));
  items.forEach((item) => {
    const placeholder = renderer(item);
    placeholder.classList.add('placeholder');
    block.append(placeholder);
  });
}

/**
 * Render list
 *
 * @param {HTMLElement} block
 * @param {function} renderer
 * @param {Array} items
 * @param {Number|String} limit
 * @returns {Promise<void>}
 */
async function renderList(block, renderer, items, limit) {
  // get pagination
  const pagination = await renderPagination(block, items, getCurrentPage(), limit);

  // get items for current page
  let relevantItems = items;
  if (pagination) {
    relevantItems = getItemsForCurrentPage(items, limit);
  }

  // build HTML
  relevantItems.forEach((item) => {
    if (!item.renderedHtml) {
      item.renderedHtml = renderer(item);
    }
  });

  // render
  block.innerHTML = '';
  if (pagination) {
    block.append(pagination);
  }
  relevantItems.forEach((item) => {
    block.append(item.renderedHtml);
  });
}

/**
 * Decorate list
 *
 * @param {HTMLElement} block
 * @param {string} listType
 * @param {Function} renderer
 * @param {Function} [itemManipulator]
 * @returns {Promise<void>}
 */
async function decorateList(block, listType, renderer, itemManipulator) {
  // get config
  const config = readBlockConfig(block);
  const amount = Number.parseInt(config.amount, 10) || 0;
  const limit = Number.parseInt(config.limit, 10) || 10;

  // render placeholders to prevent layout shifts
  renderPlaceholders(block, renderer, limit);

  // ensure placeholders have been loaded
  await loadPlaceholders();

  // get items
  let items = [];
  if (block.classList.contains('all')) {
    items = await fetchTenantsListItems(listType, getTenants());
  } else if (block.classList.contains('with-global')) {
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

  // set filter items
  const filterBlock = getFilterBlock(block);
  if (filterBlock) {
    // set items to be filtered
    filterBlock.filterItems = items;

    // when we process filters, the items and pagination need to be re-drawn
    filterBlock.addEventListener('filtersProcessed', async () => {
      await renderList(block, renderer, items, limit);
    });
    filterBlock.dispatchEvent(new Event('renderFilters'));
  } else {
    // when we change the page, the list should be updated even if no filters are present
    block.addEventListener('pageChanged', async () => {
      await renderList(block, renderer, items, limit);
    });
    block.dispatchEvent(new Event('pageChanged'));
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
