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

/* global WebImporter */

import { determineEdsBaseUrl } from './import-util.js';

/**
 * Exclude generic content from migration
 * @param main
 */
const removeGenericContent = (main) => {
  // remove header, footer and generic elements from content
  WebImporter.DOMUtils.remove(main, [
    '.offcanvas',
    '.sidebar-offcanvas',
    '.top-navigation',
    '.company-name',
    '.group-title',
    '.off-canvas-navigation',
    '.container-fluid',
    '.navbar-toggle',
  ]);
};

/**
 * Advanced handling for menu-entries.
 * Checks for links without proper targets, makes them relative to given base-url
 * @param menuEntry
 * @param baseUrl
 */
const handleMenuEntry = (menuEntry, baseUrl) => {
  // check of given entry is a link at all
  const linkEntry = menuEntry.querySelector('a');

  // if not: extract only text from entry
  if (!linkEntry) {
    return menuEntry.innerText;
  }

  // extract link from entry
  let href = linkEntry.getAttribute('href');

  // check for empty href or '#' as link target
  if ((!href) || href === '#') {
    // return only the text of the link
    return linkEntry.innerText;
  }

  // check if the target of the link is relative: handle EDS-specific url-conversions
  if (href.charAt(0) === '/') {
    // add base-url
    href = baseUrl + href;

    // remove possible parameters
    href = href.replace(/\?.*/, '');

    // remove trailing slash
    href = href.replace(/\/$/, '');

    // handle leading hyphens in document-names, that are not supported in EDS
    const urlSections = href.split('/');

    let documentName = urlSections[urlSections.length - 1];

    // check for leading hyphen in document-name
    if (documentName && documentName.charAt(0) === '-') {
      // remove first character = the hyphen
      documentName = documentName.substring(1);

      urlSections[urlSections.length - 1] = documentName;

      // re-build url
      href = urlSections.join('/');
    }
  }

  linkEntry.setAttribute('href', href);

  // remove trailing slash and return link element
  return linkEntry;
};

export default {
  transform: ({
    document,
    params,
  }) => {
    const main = document.body;

    removeGenericContent(main, document);

    // determine the future base-url
    const baseUrl = determineEdsBaseUrl(params);

    // extract navbar-header/logo
    const logoSection = main.querySelector('.navbar-header');

    const logoSectionLink = logoSection.querySelector('a');

    // replace original url by the eds base-url
    logoSectionLink.setAttribute('href', baseUrl);

    const ulNavbar = main.querySelector('ul.navbar-nav');

    // clear output in order to add only required data later on
    main.innerHTML = '';

    // add section with logo and link to homepage
    main.append(logoSection);

    // add separator
    main.append(document.createElement('hr'));

    // create ul-list for future top-navigation
    const resultList = document.createElement('ul');

    const toplevelPoints = ulNavbar.childNodes;

    // walk through top-level navigation points
    toplevelPoints.forEach((topLevelPoint) => {
      // process top-level menu-entries
      const level1Entry = document.createElement('li');

      level1Entry.append(handleMenuEntry(topLevelPoint, baseUrl));

      // process second-level menu-entries
      const secondLevelPoints = topLevelPoint.querySelectorAll('.yamm-link');

      if (secondLevelPoints.length > 0) {
        const level2List = document.createElement('ul');

        secondLevelPoints.forEach((secondLevelPoint) => {
          const secondLevelHeadline = secondLevelPoint.querySelector('h4');

          const level2Entry = document.createElement('li');

          // use the link and its text as the future menu-entry
          level2Entry.append(handleMenuEntry(secondLevelHeadline, baseUrl));

          // handle third-level entries
          const thirdLevelPoints = secondLevelPoint.querySelectorAll('li');

          // check if there are any entries on the third level (not all domains have them)
          if (thirdLevelPoints.length > 0) {
            const level3List = document.createElement('ul');

            thirdLevelPoints.forEach((thirdLevelPoint) => {
              const level3Entry = document.createElement('li');

              level3Entry.append(handleMenuEntry(thirdLevelPoint, baseUrl));

              level3List.append(level3Entry);
            });

            // append level-3 entries to the respective level-2 entry
            level2Entry.append(level3List);
          }

          level2List.append(level2Entry);
        });

        level1Entry.append(level2List);
      }

      // add top-level
      resultList.append(level1Entry);
    });

    // add nested list as top-navigation
    main.append(resultList);

    // add another separator
    main.append(document.createElement('hr'));

    // create Metadata-table
    const table = WebImporter.DOMUtils.createTable([['Metadata'], ['Robots', 'noindex, nofollow']], document);

    // add metadata-table
    main.append(table);

    // handle multi-language cases
    const originalUrl = new URL(params.originalURL);

    // set "nav" as the document-name
    const path = `${originalUrl.pathname}/nav`;

    return [{
      element: main,
      path,
    }];
  },
};
