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
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  readBlockConfig,
  sampleRUM,
  waitForLCP,
} from './aem.js';
import { getCurrentLanguage, tContent } from './i18n.js';
import { addBodyClass, hasUrlParam } from './helpers.js';
import { clearFetchCache } from './load-resource.js';
import { renderCanonical, renderHrefLang } from './partials/header-link-tags.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

/**
 * Auto-link modals
 *
 * @param {HTMLElement} element
 */
function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

// When there is a sidebar, build a hero image
function buildSidebar(main) {
  // check for sidebar
  const allSectionMetadata = main.querySelectorAll('.section-metadata');
  const hasSidebar = [...allSectionMetadata]
    .map((metadata) => readBlockConfig(metadata))
    .map((metadata) => metadata.style === 'sidebar')
    .reduce((prev, current) => prev || current, false);

  // if we have a sidebar
  if (hasSidebar) {
    addBodyClass('has-sidebar');

    // check for hero image
    const picture = main.querySelector('picture');
    if (picture) {
      // if the first element contains the picture, it is a hero image across both sections
      if (main.children[0].contains(picture)) {
        const section = document.createElement('div');
        section.classList.add('section', 'sidebar-hero');
        section.append(picture);
        main.prepend(section);
        addBodyClass('has-sidebar-hero');
      }
    }
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
function buildAutoBlocks(main) {
  try {
    // BEGIN CHANGE TechDivision
    // removed auto blocking for hero blocks
    buildSidebar(main);
    // END CHANGE TechDivision
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Wraps images followed by links within a matching <a> tag.
 *
 * @param {Element} picture The picture element
 */
function linkPicture(picture) {
  const checkAndAppendLink = (anchor) => {
    if (anchor && anchor.textContent.trim()
      .startsWith('https://')) {
      anchor.innerHTML = '';
      anchor.className = '';
      anchor.appendChild(picture);
    }
  };

  // Handle case where link is directly after image, or with a <br> between.
  let nextSib = picture.nextElementSibling;
  if (nextSib?.tagName === 'BR') {
    const br = nextSib;
    nextSib = nextSib.nextElementSibling;
    br.remove();
  }

  if (nextSib?.tagName === 'A') {
    checkAndAppendLink(nextSib);
    return;
  }

  // Handle case where link is in a separate paragraph
  const parent = picture.parentElement;
  const parentSibling = parent.nextElementSibling;
  if (parent.tagName === 'P' && parentSibling?.tagName === 'P') {
    const maybeA = parentSibling.children?.[0];
    if (parentSibling.children?.length === 1 && maybeA?.tagName === 'A') {
      checkAndAppendLink(maybeA);
      if (parent.children.length === 0) {
        parent.remove();
      }
    }
  }
}

/**
 * Add overview link to element
 *
 * @param {Element} main
 * @param {string} linkText
 * @param {string} appendTo
 * @param {boolean} buttonStyle
 */
function addOverviewLink(main, linkText, appendTo, buttonStyle) {
  const overviewLink = getMetadata('overview_link');
  if (overviewLink) {
    const link = document.createElement('a');
    link.href = overviewLink;
    tContent(link, linkText)
      .then();

    if (buttonStyle) {
      link.classList.add('button');
    }

    const element = [...main.querySelectorAll(appendTo + ':last-child') || []].pop();
    if (element) {
      element.append(link);
    }
  }
}

/**
 * Add publishing date and news link to news articles
 * @param {Element} main The container element
 */
function decorateNews(main) {
  const datePublished = getMetadata('date_published');
  const date = document.createElement('p');
  tContent(date, 'published on %1', datePublished)
    .then();
  if (datePublished) {
    date.classList.add('publish-date');

    const sidebar = main.querySelector('.sidebar');
    if (sidebar) {
      sidebar.prepend(date);
    }
  }

  addOverviewLink(main, 'More news', '.default-content-wrapper', false);
}

/**
 * Add overview link to event sidebar
 * @param {Element} main The container element
 */
function decorateEvents(main) {
  addOverviewLink(main, 'More events', '.sidebar', true);
}

export function decorateLinkedPictures(block) {
  block.querySelectorAll('picture')
    .forEach((picture) => {
      linkPicture(picture);
    });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateLinkedPictures(main);
  if (getMetadata('template') === 'news') {
    decorateNews(main);
  }
  if (getMetadata('template') === 'events') {
    decorateEvents(main);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {HTMLElement|Element|Document} doc The container element
 */
async function loadEager(doc) {
  // head and body tags
  document.documentElement.lang = getCurrentLanguage();
  decorateTemplateAndTheme();
  renderCanonical();
  renderHrefLang();
  document.addEventListener('changedLanguages', renderHrefLang);

  // clear cache
  if (hasUrlParam('nocache')
    || hasUrlParam('disablecache')) {
    await clearFetchCache();
  }

  // decorate main
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts()
        .then();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {HTMLElement|Element|Document} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'))
    .then();
  loadFooter(doc.querySelector('footer'))
    .then();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`)
    .then();
  loadFonts()
    .then();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage()
  .then();
