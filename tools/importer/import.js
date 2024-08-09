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

import {
  determineEdsBaseUrl,
  handleTable,
  handleTopImage,
  handleLinks,
  handle2ColumnsGrid,
  handle3ColumnsGrid,
  handleSidebar,
  handleImages,
  handleIcons,
  handleIframes,
  handleAccordions,
  handleGallerySlider,
  handleTextBoxes,
  handleFilterAndRows,
  handleImagesInText,
  handleTextPic,
  handleBrs,
  handleContacts,
  handlePdfs,
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
    '.locations',
  ]);
};

/**
 * Handle blockquotes by converting them to an EDS Video block
 * @param main
 * @param document
 */
export const handleBlockquotes = (main, document) => {
  const blockquotes = main.querySelectorAll('blockquote');

  blockquotes.forEach((blockquote) => {
    // handle TikTok-videos - use cite as the video-url
    const cite = blockquote.getAttribute('cite');

    if (cite && cite.startsWith('https://www.tiktok.com/')) {
      const cells = [
        ['Video'],
        [cite],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      blockquote.replaceWith(resultTable);
    }
  });
};

/**
 * Handle "shop"/location data
 * @param main
 * @param document
 */
export const handleShopData = (main, document) => {
  // handle "shop-accordion" which contains the main data about the location
  const shopAccordion = main.querySelector('div.shop-accordion');

  if (shopAccordion) {
    const locationResult = document.createElement('div');

    // remove some specific data
    shopAccordion.querySelector('p.gmap-distance').remove();
    shopAccordion.querySelector('img + img').remove();

    // extract sections of the original content
    const headlineSection = shopAccordion.querySelector('div.headline');
    const addressDetails = shopAccordion.querySelector('div.address-details');
    // handle general contacts, replace them by EDS Table-element

    const generalContactCells = [
      ['Table (no header, no border)'],
    ];

    const generalContacts = shopAccordion.querySelectorAll('div.division');

    generalContacts.forEach((generalContact) => {
      const divisionName = generalContact.querySelector('div.division-name');
      const phoneNumbers = generalContact.querySelector('div.phone-numbers');
      const openTimes = generalContact.querySelector('div.open-times');

      generalContactCells.push([divisionName, phoneNumbers, openTimes]);
    });

    const generalContactTable = WebImporter.DOMUtils.createTable(generalContactCells, document);

    // re-add sections to result in required structure
    locationResult.append(headlineSection);
    locationResult.append(document.createElement('hr'));
    locationResult.append(addressDetails);
    locationResult.append(generalContactTable);

    const sectionMetadata = [
      ['Section Metadata'],
      ['Style', 'side-by-side'],
    ];
    const sectionMetadataTable = WebImporter.DOMUtils.createTable(sectionMetadata, document);

    locationResult.append(sectionMetadataTable);
    locationResult.append(document.createElement('hr'));

    shopAccordion.replaceWith(locationResult);
  }

  // handle list of employees/contacts
  const shopContent = main.querySelector('div.shop-content');

  if (shopContent) {
    const contactsResult = document.createElement('div');
    const shopDivisions = shopContent.querySelectorAll('div.shop-division');

    shopDivisions.forEach((shopDivision) => {
      // get headline
      const headline = shopDivision.querySelector('div.shop-division-headline');

      contactsResult.append(headline);

      const cells = [
        ['Contacts'],
      ];

      const staffItems = shopDivision.querySelectorAll('div.staff-item');

      // Array to collect three staff-entries
      let staffEntries = [];

      staffItems.forEach((staffItem) => {
        const name = staffItem.querySelector('p.staff-headline');

        staffEntries.push(name);

        // check if limit of 3 staff-items per row is reached
        if (staffEntries.length === 3) {
          // push row to result-table
          cells.push(staffEntries);

          // create a new array to store further entries
          staffEntries = [];
        }
      });
      // add staff-rows that did not make up a full row
      if (staffEntries.length > 0) {
        // create an array that contains the necessary number of empty items
        const emptyEntries = new Array(3 - staffEntries.length);
        emptyEntries.fill('');

        const paddedArray = [];

        // first add the entries that are filled
        staffEntries.forEach((staffEntry) => {
          paddedArray.push(staffEntry);
        });

        // then add the empty entries to match a total count of 3
        emptyEntries.forEach((emptyEntry) => {
          paddedArray.push(emptyEntry);
        });

        cells.push(paddedArray);
      }

      // create a Block that contains all the Contacts
      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      contactsResult.append(resultTable);
    });

    shopContent.replaceWith(contactsResult);
  }
};

export default {
  transform: ({
    document,
    url,
    params,
  }) => {
    const main = document.body;

    const baseUrl = determineEdsBaseUrl(params);

    // list of resulting documents in EDS, might be multiple if downloadable PDFs are present
    const results = [];

    // handle possible internal links to PDF-documents
    handlePdfs(main, url, baseUrl, results);

    // handle content of the document itself
    removeGenericContent(main);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    // handle image-slider before modifying image-urls in general
    handleGallerySlider(main, document, baseUrl);

    // handle images for all other imports that follow
    handleImages(main);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle2ColumnsGrid(main, document);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);
    handleTextBoxes(main, document);
    handleFilterAndRows(main, document);
    handleImagesInText(main, document);
    handleTextPic(main, document);
    handleBrs(main, document);
    handleContacts(main, document);
    handleBlockquotes(main, document);
    handleShopData(main, document);

    WebImporter.rules.createMetadata(main, document);

    results.push({
      element: main,
      path: new URL(url).pathname,
    });

    return results;
  },
};
