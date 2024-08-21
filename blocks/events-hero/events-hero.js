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

// noinspection DuplicatedCode

import { tContent } from '../../scripts/i18n.js';
import { decorateIcons, getMetadata, readBlockConfig } from '../../scripts/aem.js';
import manipulateEventItems from '../events/lib/events.js';
import { decorateList } from '../../scripts/list.js';
import { getCurrentUrl } from '../../scripts/helpers.js';

/**
 * Render item
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function renderItem(item) {
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
          <a title="${item.title}" href="${item.path}" target="${urlTarget}">${item.dateRange}</a>
        </div>
        <div class="title">
            <a title="${item.title}" href="${item.path}" target="${urlTarget}" class="has-chevron">${item.title}</a>
        </div>
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
  // get config
  let config = readBlockConfig(block);
  config = {
    ...config,
    amount: 2,
    classes: [...block.classList],
  };

  // remove all configuration rows
  block.querySelectorAll(':scope > div')
    .forEach((div) => {
      const childDivs = div.querySelectorAll(':scope > div');
      if (childDivs.length > 1) {
        div.remove();
      }
    });

  // content container
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('container-content');
  contentContainer.append(...block.childNodes);
  block.append(contentContainer);

  // events container
  const eventsContainer = document.createElement('div');
  eventsContainer.classList.add('container-events');
  block.append(eventsContainer);

  // add heading
  const eventsHeading = document.createElement('p');
  eventsHeading.classList.add('events-heading');
  const eventsHeadingIcon = document.createElement('span');
  eventsHeadingIcon.classList.add('icon', 'icon-event');
  eventsHeading.append(eventsHeadingIcon);
  eventsContainer.append(eventsHeading);
  decorateIcons(eventsHeading);
  tContent(eventsHeading, 'Events')
    .then();

  // add list
  const eventsList = document.createElement('div');
  eventsList.classList.add('events-list');
  eventsContainer.append(eventsList);

  // add all events link
  const allEventsLink = document.createElement('a');
  allEventsLink.classList.add('has-chevron');
  // noinspection JSUnresolvedReference
  allEventsLink.href = config.overview || getMetadata('overview_link') || '/';
  tContent(allEventsLink, 'All events')
    .then();
  eventsContainer.append(allEventsLink);

  // render events
  decorateList(eventsList, config, 'events', renderItem, manipulateEventItems)
    .then();
}
