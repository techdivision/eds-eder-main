/* global WebImporter */

import determineEdsBaseUrl from './import-util.js';

const removeGenericContent = (main) => {
  // remove header, footer and generic elements from content
  WebImporter.DOMUtils.remove(main, [
    'nav',
    '.nav',
    'footer',
    '.footer',
    'noscript',
    '.footer-box',
    '.offcanvas',
    '.breadcrumb',
    '.visible-xs',
    '.visible-ma-button',
    '.offcanvas',
  ]);
};

/**
 * Handle HTML-Table by adding the respective headline in order to mark them as an EDS table block
 * @param main
 * @param document
 */
const handleTable = (main, document) => {
  const table = main.querySelector('table');

  if (table) {
    // determine proper EDS table-type
    let tableHeadline = 'Table (no header, no border)';

    // tables with class table in Typo3 are the ones with borders
    if (table.className.includes('table')) {
      tableHeadline = 'Table (no header)';
    }

    // add one row to table, before the tables original content
    const headlineRow = document.createElement('tr');

    const headlineData = document.createElement('td');
    headlineData.setAttribute('colspan', 2);
    headlineData.append(tableHeadline);

    headlineRow.append(headlineData);

    table.prepend(headlineRow);
  }
};

/**
 * Handle sidebar by converting its HTML-Markup to the EDS section-structure
 * @param main
 * @param document
 */
const handleSidebar = (main, document) => {
  const sidebar = main.querySelector('div.news-sidebar');

  if (sidebar) {
    // add separator before the sidebar-content
    sidebar.prepend(document.createElement('hr'));

    // add metadata-table after sidebar-content
    const cells = [
      ['Section Metadata'],
      ['Style', 'sidebar'],
    ];

    const table = WebImporter.DOMUtils.createTable(cells, document);

    sidebar.append(table);
  }
};

/**
 * Handle icons by replacing their HTML-markup by the EDS-notation :iconname:
 */
const handleIcons = (main) => {
  const iconMapping = {
    'flaticon flaticon-phone': ':telephone:',
    'flaticon flaticon-fax': ':fax:',
    'flaticon flaticon-email': ':email:',
  };

  const originalIcons = main.querySelectorAll('span.flaticon');

  originalIcons.forEach((originalIcon) => {
    const originalClassName = originalIcon.className;

    if (iconMapping[originalClassName]) {
      originalIcon.replaceWith(iconMapping[originalClassName]);
    }
  });
};

/**
 * Handle images by using their data-regular-attribute (if there is any)
 * @param main
 */
const handleImages = (main) => {
  const images = main.querySelectorAll('img');

  images.forEach((image) => {
    const srcRegular = image.getAttribute('data-regular');

    if (srcRegular) {
      image.src = srcRegular;
    }
  });
};

/**
 * Handle links by making them absolute instead of relative, also converts buttons to EDS-markup
 * @param main
 * @param document
 * @param baseUrl
 */
const handleLinks = (main, document, baseUrl) => {
  const links = main.querySelectorAll('a');

  if (links) {
    links.forEach((link) => {
      // make link absolute
      let href = link.getAttribute('href');

      // replace relative urls
      if (href.charAt(0) === '/') {
        link.setAttribute('href', baseUrl + href);
      }

      // replace http- by https-urls
      if (href.startsWith('http://')) {
        href = `https://${href.slice('7')}`;

        link.setAttribute('href', href);
      }

      // check if parent has class 'coa-button', thus is button in Typo3
      const parent = link.parentElement;

      if (parent.className.includes('coa-button') || parent.className.includes('offer-btn-wrapper')) {
        const linkText = link.innerText;

        // create a bold element to assign the original text to
        const boldElement = document.createElement('strong');

        boldElement.append(linkText);

        link.innerHTML = boldElement.outerHTML;
      }
    });
  }
};

const handle3ColumnsGrid = (main, document) => {
  // get the column-element from Typo3 that matches the third-width card EDS-Block
  const thirdWidthCards = main.querySelectorAll('div.col-md-4');

  if (thirdWidthCards.length > 0) {
    const cells = [
      ['Cards (third-width)'],
    ];

    let parent;

    thirdWidthCards.forEach((thirdWidthCard) => {
      parent = thirdWidthCard.parentElement;

      const imageDiv = document.createElement('div');

      // copy image to its own entry
      const image = thirdWidthCard.querySelector('img').cloneNode(true);

      const heroText = thirdWidthCard.querySelector('div.category-heroimage');

      imageDiv.append(image);

      if (heroText) {
        imageDiv.append(heroText);
      }

      // remove the image from the other content
      thirdWidthCard.querySelector('img').remove();

      cells.push(
        [imageDiv, thirdWidthCard],
      );
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    parent.replaceWith(resultTable);
  }
};

const handleTopImage = (main, document) => {
  const contentHeader = main.querySelector('div.content-header');

  if (contentHeader) {
    let dataBg = contentHeader.getAttribute('data-bg');

    // handle data-bg="url(/...)"
    if (dataBg.startsWith('url(')) {
      dataBg = dataBg.slice(4, -1);
    }

    // create an img-tag for the former background
    const imageElement = document.createElement('img');
    imageElement.src = dataBg;

    const h1 = contentHeader.querySelector('h1');

    // build-up new structure
    const result = document.createElement('div');

    // add image first
    result.append(imageElement);

    // add headline thereafter
    result.append(h1);

    contentHeader.replaceWith(result);
  }
};

export default {
  transformDOM: ({
    document,
    params,
  }) => {
    const main = document.body;

    removeGenericContent(main);

    const baseUrl = determineEdsBaseUrl(params);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleImages(main);
    handleIcons(main);

    WebImporter.rules.createMetadata(main, document);

    return main;
  },
};
