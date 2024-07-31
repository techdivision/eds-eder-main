// noinspection JSUnresolvedReference

import { decorateList } from '../../scripts/list.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { convertDate, getCurrentUrl, getReadableDate } from '../../scripts/helpers.js';
import { ts } from '../../scripts/i18n.js';

/**
 * Check if event is relevant
 *
 * @param {Object} item
 */
function isCurrentEvent(item) {
  return !item.endDate || convertDate(item.endDate) >= new Date();
}

/**
 * Get date range
 *
 * @param {Object} item
 * @returns {string}
 */
function getDateRange(item) {
  const startDate = getReadableDate(convertDate(item.startDate));
  const endDate = getReadableDate(convertDate(item.endDate));
  const startTime = convertDate(item.startDate)
    .toLocaleTimeString('de-DE', { timeStyle: 'short' });
  const endTime = convertDate(item.endDate)
    .toLocaleTimeString('de-DE', { timeStyle: 'short' });

  if (startDate === endDate) {
    return `${startDate} ${startTime} - ${endTime}`;
  }
  return `${startDate} - ${endDate}`;
}

/**
 * Manipulate items
 *
 * @param {Array} items
 * @returns {Array}
 */
function manipulateItems(items) {
  return items.filter((item) => {
    // check if event has ended
    if (!isCurrentEvent(item)) {
      return false;
    }

    // format date
    item.dateRange = getDateRange(item);

    // optimized image
    item.picture = createOptimizedPicture(
      item.image,
      item.title,
      true,
      [{ width: '500' }],
    ).outerHTML;
    return true;
  });
}

/**
 * Render item
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function renderItem(item) {
  const detailsText = ts('Show more');

  let urlTarget = '_self';
  if (item.path
    && item.path.includes('://')
    && new URL(item.path).host !== new URL(getCurrentUrl()).host) {
    urlTarget = '_blank';
  }

  const article = document.createElement('article');
  article.classList.add('events-list-item');
  article.innerHTML = `
    <div class="details-wrapper">
        <div class="date">${item.dateRange}</div>
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

/**
 * Decorate events block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  decorateList(block, 'events', renderItem, manipulateItems)
    .then();
}
