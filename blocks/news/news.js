import {
  fetchListItems,
  getFilterBlock,
  renderList,
} from '../../scripts/list.js';
import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { convertDate } from '../../scripts/helpers.js';
import { loadPlaceholders, tSync } from '../../scripts/i18n.js';

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
      false,
      [{ width: '500' }],
    );
  });
}

/**
 * Render news item
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function renderNews(item) {
  const detailsText = tSync('details');

  const article = document.createElement('article');
  article.classList.add('news-list-item');
  article.innerHTML = `    
    <div class="image-wrapper">
      ${item.picture.outerHTML}
      </div>
      <div class="details-wrapper">
      <div class="date">${item.formattedDate}</div>
      <div class="title">
        <h3><a title="${item.title}" href="${item.path}">${item.title}</a></h3>
      </div>
      <div class="description"><p>${item.description}</p></div>
      <a class="button primary has-chevron" title="${item.title}" href="${item.path}">
        ${detailsText}
      </a>
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
  // ensure placeholders have been loaded
  await loadPlaceholders();

  // get config
  const config = readBlockConfig(block);
  const limit = Number.parseInt(config.limit, 10) || 10;

  // get items (items are already sorted by sheet)
  const items = await fetchListItems('news');
  manipulateItems(items);

  // set filter items
  const filterBlock = getFilterBlock();
  if (filterBlock) {
    // set items to be filtered
    filterBlock.filterItems = items;

    // when we process filters, the items and pagination need to be re-drawn
    filterBlock.addEventListener('filtersProcessed', async () => {
      await renderList(block, renderNews, items, limit);
    });

    // re-render filters
    filterBlock.dispatchEvent(new Event('renderFilters'));
  } else {
    await renderList(block, renderNews, items, limit);
  }
}
