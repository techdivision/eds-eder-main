import {
  fetchListItems,
  fetchTenantsListItems,
  getFilterBlock,
  renderList,
  renderPlaceholders,
} from '../../scripts/list.js';
import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { convertDate, getCurrentUrl } from '../../scripts/helpers.js';
import { loadPlaceholders, ts } from '../../scripts/i18n.js';
import { getTenants } from '../../scripts/tenants.js';
import { defaultTenant } from '../../scripts/defaults.js';

/**
 * Manipulate news items
 *
 * @param {Array} items
 */
function manipulateItems(items) {
  items.forEach((item) => {
    // filter date
    item.filterDate = convertDate(item.lastModified)
      .toLocaleDateString(
        'de-DE',
        {
          year: 'numeric',
          month: 'long',
        },
      );
    if (item.filterDate === 'Invalid Date') {
      item.filterDate = null;
    }

    // formatted date
    item.formattedDate = convertDate(item.lastModified)
      .toLocaleDateString(
        'de-DE',
        {
          dateStyle: 'medium',
        },
      );
    if (item.formattedDate === 'Invalid Date') {
      item.formattedDate = null;
    }

    // optimized image
    item.picture = createOptimizedPicture(
      item.image,
      item.title,
      true,
      [{ width: '500' }],
    ).outerHTML;
  });
}

/**
 * Render news item
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function renderNews(item) {
  const detailsText = ts('Go to article');

  let urlTarget = '_self';
  if (item.path
    && item.path.includes('://')
    && new URL(item.path).host !== new URL(getCurrentUrl()).host) {
    urlTarget = '_blank';
  }

  const article = document.createElement('article');
  article.classList.add('news-list-item');
  article.innerHTML = `
    <div class="details-wrapper">
        <div class="date">${item.formattedDate}</div>
        <div class="title">
            <h3><a title="${item.title}" href="${item.path}">${item.title}</a></h3>
        </div>
        <div class="description"><p>${item.description}</p></div>
        <a
            class="button no-button primary has-chevron"
            title="${item.title}"
            href="${item.path}"
            target="${urlTarget}">
            ${detailsText}
        </a>
    </div>
    <div class="image-wrapper">
        ${item.picture}
    </div>
`;
  return article;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Decorate news block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // get config
  const config = readBlockConfig(block);
  const amount = Number.parseInt(config.amount, 10) || 0;
  const limit = Number.parseInt(config.limit, 10) || 10;

  // render placeholders to prevent layout shifts
  renderPlaceholders(block, renderNews, limit);

  // ensure placeholders have been loaded
  await loadPlaceholders();

  // get items
  let items = [];
  if (block.classList.contains('all')) {
    items = await fetchTenantsListItems('news', getTenants());
  } else if (block.classList.contains('with-global')) {
    items = await fetchTenantsListItems(
      'news',
      [defaultTenant],
      await fetchListItems('news'),
    );
  } else {
    items = await fetchListItems('news');
  }
  manipulateItems(items);

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
      await renderList(block, renderNews, items, limit);
    });
    filterBlock.dispatchEvent(new Event('renderFilters'));
  } else {
    // when we change the page, the list should be updated even if no filters are present
    block.addEventListener('pageChanged', async () => {
      await renderList(block, renderNews, items, limit);
    });
    block.dispatchEvent(new Event('pageChanged'));
  }
}
