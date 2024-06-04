/* global WebImporter */

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
    '.navbar-toggle'
  ]);
};

/**
 * Determines the EDS base-url based on static mapping
 * @param params
 * @returns {*}
 */
const determineEdsBaseUrl = (params) => {
  const urlMapping = {
    'https://www.eder-gmbh.de': 'https://main--eds-eder-gmbh--techdivision.hlx.page',
    'https://www.eder-landtechnik.de': 'https://main--eds-eder-landtechnik--techdivision.hlx.page',
  };

  const originalUrl = new URL(params.originalURL);

  const urlToCheck = originalUrl.protocol + '//' + originalUrl.host;

  if (urlMapping[urlToCheck]) {
    return urlMapping[urlToCheck];
  }

  throw new Error('There is no mapping for the base-url ' + urlToCheck);
};

/**
 * Advanced handling for menu-entries.
 * Checks for links without proper targets, makes them relative to given base-url
 * @param menuEntry
 * @param baseUrl
 */
const handleMenuEntry = (menuEntry, baseUrl) => {
  // check of given entry is a link at all
  let linkEntry = menuEntry.querySelector('a');

  // if not: extract only text from entry
  if (!linkEntry) {
    return menuEntry.innerText;
  }

  // extract link from entry
  let href = linkEntry.getAttribute('href');

  // check for '#' as link target
  if (href === '#') {
    // return only the text of the link
    return linkEntry.innerText;
  }

  // check if the target of the link is relative: add EDS base-url
  if (href.charAt(0) === '/') {
    linkEntry.setAttribute('href', baseUrl + href);
  }

  // return link element
  return linkEntry;
};


export default {
  transform: ({document, params}) => {
    const main = document.body;

    removeGenericContent(main, document);

    // determine the future base-url
    const baseUrl = determineEdsBaseUrl(params);

    // extract navbar-header/logo
    let logoSection = main.querySelector('.navbar-header');

    let logoSectionLink = logoSection.querySelector('a');

    // replace original url by the eds base-url
    logoSectionLink.setAttribute('href', baseUrl);

    let ulNavbar = main.querySelector('ul.navbar-nav');

    // clear output in order to add only required data later on
    main.innerHTML = '';

    // add section with logo and link to homepage
    main.append(logoSection);

    // add separator
    main.append(document.createElement('hr'));

    // create ul-list for future top-navigation
    let resultList = document.createElement('ul');

    let toplevelPoints = ulNavbar.childNodes;

    // walk through top-level navigation points
    toplevelPoints.forEach(function (topLevelPoint) {
      // process top-level menu-entries
      let level1Entry = document.createElement('li');

      level1Entry.append(handleMenuEntry(topLevelPoint, baseUrl));

      // process second-level menu-entries
      let secondLevelPoints = topLevelPoint.querySelectorAll('.yamm-link');

      if (secondLevelPoints.length > 0) {
        let level2List = document.createElement('ul');

        secondLevelPoints.forEach(function (secondLevelPoint) {
          let secondLevelHeadline = secondLevelPoint.querySelector('h4');

          let level2Entry = document.createElement('li');

          // use the link and its text as the future menu-entry
          level2Entry.append(handleMenuEntry(secondLevelHeadline, baseUrl));

          // handle third-level entries
          let thirdLevelPoints = secondLevelPoint.querySelectorAll('li');

          // check if there are any entries on the third level (not all domains have them)
          if (thirdLevelPoints.length > 0) {
            let level3List = document.createElement('ul');

            thirdLevelPoints.forEach(function (thirdLevelPoint) {
              let level3Entry = document.createElement('li');

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

    // set target-path to "nav" instead of the path of the original page
    const path = '/nav';

    return [{
      element: main,
      path,
    }];
  }
};
