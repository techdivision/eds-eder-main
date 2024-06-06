import ffetch from './vendor/ffetch.js';
import { getUrlParam, setUrlParam } from './helpers.js';
import { loadPlaceholders, tSync } from './i18n.js';

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
 * @returns {Element}
 */
function getFilterBlock() {
  return document.querySelector('.filter.block');
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
  const newUrl = new URL(window.location);
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
  li.append(createPaginationLink(page, label));
  return li;
}

/**
 * Render pagination
 *
 * @param {Array} items
 * @param {Number|String} page
 * @param {Number|String} limit
 * @returns {Promise<HTMLElement>}
 */
async function renderPagination(items, page, limit) {
  // ensure placeholders have been loaded
  await loadPlaceholders();

  // find filter block
  const filterBlock = getFilterBlock();
  if (!filterBlock) {
    return null;
  }

  // get filtered items
  const filteredItems = getFilteredItems(items);

  // create element
  const listPagination = document.createElement('div');
  listPagination.classList.add('pagination');

  // check limit
  if (!limit || filteredItems.length <= limit) {
    return listPagination;
  }

  // calculate page number
  const maxPages = Math.ceil(filteredItems.length / limit);

  const list = document.createElement('ol');
  if (page > 1) {
    list.append(createPaginationListItem(page - 1, tSync('previous')));
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
    list.append(createPaginationListItem(page + 1, tSync('next')));
  }

  // add list page links
  const listPageLinks = document.createElement('div');
  listPageLinks.classList.add('pages');
  listPageLinks.append(list);

  // add list size
  const listSize = document.createElement('div');
  listSize.classList.add('size');
  listSize.textContent = tSync('pagexofy', page, maxPages);
  listPagination.append(listSize, listPageLinks);

  // add click event
  listPagination.addEventListener('click', (event) => {
    const dataPage = event.target.getAttribute('data-page');
    if (dataPage) {
      setCurrentPage(dataPage);
      filterBlock.dispatchEvent(new Event('renderFilters'));
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
 * Fetch list items
 *
 * @param {String} listType
 * @returns {Promise<Array>}
 */
async function fetchListItems(listType) {
  return ffetch('/query-index.json')
    .sheet(listType)
    .all();
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
  const pagination = await renderPagination(items, getCurrentPage(), limit);

  // get items for current page
  const itemsForCurrentPage = getItemsForCurrentPage(items, limit);

  // render
  block.innerHTML = '';
  if (pagination) {
    block.append(pagination);
  }
  (pagination ? itemsForCurrentPage : items).forEach((item) => {
    if (!item.renderedHtml) {
      item.renderedHtml = renderer(item);
    }
    block.append(item.renderedHtml);
  });
}

export {
  getCurrentPage,
  setCurrentPage,
  getItemsForCurrentPage,
  fetchListItems,
  getFilterBlock,
  renderPagination,
  renderList,
};
