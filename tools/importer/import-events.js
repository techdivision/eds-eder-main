/* global WebImporter */

import {
  determineEdsBaseUrl,
  shouldBeImported,
  handleTable,
  handleTopImage,
  handleLinks,
  handle3ColumnsGrid,
  handleSidebar,
  handleImages,
  handleIcons,
  handleIframes,
  handleAccordions,
  handleGallerySlider,
  handleContacts,
} from './import-util.js';

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
  ]);
};

const initAdditionalData = () => {
  // cache events metadata sheet for events imports
  const request = new XMLHttpRequest();
  request.open(
    'GET',
    'https://main--eds-eder-main--techdivision.hlx.page/migration/events-metadata.json',
    false,
  );
  request.overrideMimeType('text/json; UTF-8');
  request.send(null);

  if (request.status === 200) {
    window.eventsList = JSON.parse(request.responseText).data;
  }
};

/**
 * Handles metadata, by migrating the default entries and extracting the news-specific entries.
 * @param main
 * @param document
 * @param event
 */
const handleMetadata = (main, document, event) => {
  // get regular metadata as its original done in WebImporter.rules.createMetadata
  const meta = WebImporter.Blocks.getMetadata(document);

  // prefix url from typo3-dump
  if (event.preview_image) {
    // prefix url from typo3-dump
    const previewImage = `/fileadmin${event.preview_image}`;
    // create img-tag in order to allow administration of image, and not only the url
    const image = document.createElement('img');
    image.setAttribute('src', previewImage);

    meta.preview_image = image;
  }

  meta.section = event.section || '';

  // create table for metadata and append it like it's done in WebImporter.rules.createMetadata
  if (Object.keys(meta).length > 0) {
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
  }
};

/**
 * Removes the link back to the event overview-page,
 * as it should come from the implementation not the content.
 * @param main
 */
const removeEventsOverviewLink = (main) => {
  const sidebar = main.querySelector('div.news-sidebar');

  const buttons = sidebar.querySelectorAll('div.coa-button');

  buttons.forEach((button) => {
    // check for text within the button - unfortunately there is no other way
    const buttonText = button.innerText;

    if (buttonText.includes('Weitere Events')) {
      button.remove();
    }
  });
};

/**
 * Returns document-path for given url - copy of EDS-core import-method, as it can not be accessed
 * @param url
 * @returns {string}
 */
const generateDocumentPath = (url) => {
  let p = new URL(url).pathname;
  if (p.endsWith('/')) {
    p = `${p}index`;
  }
  return decodeURIComponent(p)
    .toLowerCase()
    .replace(/\.html$/, '')
    .replace(/[^a-z0-9/]/gm, '-');
};

const handleDates = (main, document) => {
  const datesWrapper = main.querySelector('div.dates-wrapper');

  if (datesWrapper) {
    // extract date from original String
    const firstDate = datesWrapper.querySelector('div.first-date');
    const firstDateSections = firstDate.innerHTML.split(',');
    const extractedFirstDate = firstDateSections[1].trim();

    const firstTime = datesWrapper.querySelector('div.first-time');
    const firstTimeSections = firstTime.innerHTML.split(' ');
    const extractedFirstTime = firstTimeSections[1].trim();

    const secondDate = datesWrapper.querySelector('div.second-date');
    const secondDateSections = secondDate.innerHTML.split(',');
    const extractedSecondDate = secondDateSections[1].trim();

    const secondTime = datesWrapper.querySelector('div.second-time');
    const secondTimeSections = secondTime.innerHTML.split(' ');
    const extractedSecondTime = secondTimeSections[1].trim();

    const cells = [
      ['Dates'],
      [`${extractedFirstDate} ${extractedFirstTime}`],
    ];

    if (extractedSecondDate && extractedSecondTime) {
      cells.push(
        [`${extractedSecondDate} ${extractedSecondTime}`],
      );
    }

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    datesWrapper.replaceWith(resultTable);
  }
};

export default {
  transform: ({
    url,
    document,
    params,
    html,
  }) => {
    // load additional data (the data that is not present in the HTML-markup)
    if (!window.eventsList) {
      initAdditionalData();
    }

    // determine whether the current news should be imported
    const originalUrl = new URL(params.originalURL);

    const originalUrlSections = url.split('/');

    const pathSegment = originalUrlSections[originalUrlSections.length - 2];

    const event = window.eventsList.find((entry) => entry.path_segment === pathSegment);

    // make sure additional data is present
    if (!event) {
      /* eslint-disable no-console */
      console.log(`No import can take place as no additional data was found for the event with path-segment '${pathSegment}'`);
      /* eslint-enable no-console */
      return [];
    }

    // do not import if the section of the news does not match the section of the import
    if (!shouldBeImported(event, originalUrl)) {
      return [];
    }

    const main = document.body;

    removeGenericContent(main);
    removeEventsOverviewLink(main);

    const baseUrl = determineEdsBaseUrl(params);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    // handle image-slider before modifying image-urls in general
    handleGallerySlider(main, document, baseUrl);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleImages(main);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);
    handleContacts(main, document);

    // handel events' custom block: dates
    handleDates(main, document);

    // handle both custom and default metadata
    handleMetadata(main, document, event, html);

    // get target document-path like it is done during the 1:1 import
    const path = generateDocumentPath(url);

    return [{
      element: main,
      path,
    }];
  },
};
