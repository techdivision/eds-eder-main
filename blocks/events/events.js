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

import { decorateList } from '../../scripts/list.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { getCurrentUrl } from '../../scripts/helpers.js';
import { ts } from '../../scripts/i18n.js';
import manipulateEventItems from './lib/events.js';

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
        <div class="date">
          ${item.dateRange}
        </div>
        <div class="title">
            <h3>
                <a title="${item.title}" href="${item.path}" target="${urlTarget}">
                  ${item.title}
                </a>
            </h3>
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
  const config = readBlockConfig(block);
  config.classes = [...block.classList];

  decorateList(block, config, 'events', renderItem, manipulateEventItems)
    .then();
}
