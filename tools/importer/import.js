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
  handle4ColumnsGrid,
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
  isEderGmbh,
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
    '.hidden-ma-button',
    '.locations',
    '.route-link',
    '.hidden',
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
  const shopAccordions = main.querySelectorAll('div.shop-accordion');

  shopAccordions.forEach((shopAccordion) => {
    const locationResult = document.createElement('div');

    // remove some specific data
    shopAccordion.querySelector('p.gmap-distance').remove();
    shopAccordion.querySelector('img + img').remove();

    // extract sections of the original content
    const headlineSection = shopAccordion.querySelector('div.headline');
    const addressDetails = shopAccordion.querySelector('div.address-details');

    // remove hidden button from address-details
    const detailButton = addressDetails.querySelector('a.detail-link');

    if (detailButton) {
      detailButton.remove();
    }

    // handle general contacts, replace them by EDS Table-element

    const generalContactCells = [
      ['Table (no header, no border, striped)'],
    ];

    const generalContacts = shopAccordion.querySelectorAll('div.division');

    generalContacts.forEach((generalContact) => {
      const divisionNameDiv = generalContact.querySelector('div.division-name');
      const phoneNumbersDiv = generalContact.querySelector('div.phone-numbers');
      const openTimesDiv = generalContact.querySelector('div.open-times');

      // make division name bold
      const originalDivisionName = divisionNameDiv.querySelector('p.text-bold');

      let formattedDivisionName;

      if (originalDivisionName) {
        formattedDivisionName = document.createElement('strong');
        formattedDivisionName.append(originalDivisionName.innerText);
      } else {
        formattedDivisionName = '';
      }

      // format phone-numbers
      const phoneNumberRows = phoneNumbersDiv.querySelectorAll('div.row');

      phoneNumberRows.forEach((phoneNumberRow) => {
        const icon = phoneNumberRow.querySelector('div.col-xs-3');
        const text = phoneNumberRow.querySelector('div.col-xs-9');
        const paragraph = text.querySelector('p');

        phoneNumberRow.innerHTML = `${icon.innerHTML} ${paragraph.innerHTML}`;
      });

      // format openTimes
      const openTimeRows = openTimesDiv.querySelectorAll('div.col-xs-12');

      openTimeRows.forEach((openTimeRow) => {
        const firstEntry = openTimeRow.querySelector('div.col-xs-3');
        const secondEntry = openTimeRow.querySelector('div.col-xs-9');

        if (firstEntry && secondEntry) {
          openTimeRow.innerHTML = `${firstEntry.innerText} ${secondEntry.innerText}`;
        }
      });

      generalContactCells.push([formattedDivisionName, phoneNumbersDiv, openTimesDiv]);
    });

    const generalContactTable = WebImporter.DOMUtils.createTable(generalContactCells, document);

    // re-add sections to result in required structure
    locationResult.append(headlineSection);
    locationResult.append(document.createElement('hr'));
    locationResult.append(addressDetails);
    locationResult.append(generalContactTable);

    const sectionMetadata = [
      ['Section Metadata'],
      ['Style', 'location'],
    ];
    const sectionMetadataTable = WebImporter.DOMUtils.createTable(sectionMetadata, document);

    locationResult.append(sectionMetadataTable);
    locationResult.append(document.createElement('hr'));

    shopAccordion.replaceWith(locationResult);
  });

  // handle list of employees/contacts
  const shopContent = main.querySelector('div.shop-content');

  if (shopContent) {
    const contactsResult = document.createElement('div');
    const shopDivisions = shopContent.querySelectorAll('div.shop-division');

    shopDivisions.forEach((shopDivision) => {
      // get headline
      const headlineDiv = shopDivision.querySelector('div.shop-division-headline');

      // convert existing headline to h3
      const headline = headlineDiv.querySelector('span.division-name');
      const h3 = document.createElement('h3');
      h3.append(headline.innerText);

      contactsResult.append(h3);

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

/**
 * Method to migrate the list of news, including its optional filter
 * @param main
 * @param document
 * @param params
 */
export const handleNewsList = (main, document, params) => {
  // get parent-element(s)
  const newsListElements = main.querySelectorAll('div.news-list-view');

  newsListElements.forEach((newsListElement) => {
    // handle (possible) filter
    const newsFilter = newsListElement.querySelector('div.news-search-form');

    if (newsFilter) {
      const newsFilterCells = [
        ['Filter'],
        ['Geschäftsbereich', 'dropdown', 'section'],
        ['Standort', 'dropdown', 'location'],
        ['Termine', 'dropdown', 'filterDate'],
      ];

      const newsFilterResultTable = WebImporter.DOMUtils.createTable(newsFilterCells, document);

      newsFilter.replaceWith(newsFilterResultTable);
    }

    // handle the news-list itself
    const newsList = newsListElement.querySelector('div.news-content');

    if (newsList) {
      // determine block-variation
      let newsListBlockName = 'News (with global)';

      if (isEderGmbh(params)) {
        // use different Block for eder-gmbh
        newsListBlockName = 'News (all)';
      }

      const newsListCells = [
        [newsListBlockName],
        ['Limit', '10'],
      ];

      const newsListResultTable = WebImporter.DOMUtils.createTable(newsListCells, document);

      newsList.replaceWith(newsListResultTable);
    }
  });
};

/**
 * Method to migrate the list of events
 * @param main
 * @param document
 * @param params
 */
export const handleEventsList = (main, document, params) => {
  const eventsList = main.querySelector('div.element-sfeventmgt_pievent');

  if (eventsList) {
    // determine block-variation
    let eventsListBlockName = 'Events (with global)';

    if (isEderGmbh(params)) {
      // use different Block for eder-gmbh
      eventsListBlockName = 'Events (all)';
    }

    const eventsListCells = [
      [eventsListBlockName],
      ['Limit', '10'],
    ];

    const eventsListResultTable = WebImporter.DOMUtils.createTable(eventsListCells, document);

    eventsList.replaceWith(eventsListResultTable);
  }
};

/**
 * Handle Contact-Banner variations by replacing them by one unified EDS-Block
 * @param main
 * @param document
 */
export const handleContactBanner = (main, document) => {
  // check for all the different variations of the Contact-Banner
  const originalContactBlocks = document.querySelectorAll('div.tf-service-wrapper, div.kontakt-banner-content, div.staff');

  originalContactBlocks.forEach((originalContactBlock) => {
    let names = originalContactBlock.querySelectorAll('p.h3, p.staff-headline');

    // handle special cases, where no name is given
    if (names.length === 0) {
      names = [];
      // names to look for
      const namesToCheck = [
        'Daniel Strehle',
        'Klaus Mayer',
        'EDER LANDTECHNIK',
        'RTK-Experten',
        'AGRATEC LANDTECHNIKZENTRUM',
        'Stefan Buchner',
      ];

      // check if name can be extracted from the text
      namesToCheck.forEach((nameToCheck) => {
        if (originalContactBlock.innerText.includes(nameToCheck)) {
          names.push(nameToCheck);
        }
      });
    }

    if (names.length > 0) {
      const cells = [
        ['Contact-Banner'],
      ];

      // check if there are multiple names within the Block
      if (names.length > 1) {
        cells.push([names[0], names[1]]);
      } else {
        cells.push([names[0]]);
      }

      // check if there are
      const buttons = originalContactBlock.querySelectorAll('div.coa-button');

      let firstButton;
      if (buttons.length > 0) {
        [firstButton] = buttons;

        // push one link for each entry
        if (names.length > 1) {
          cells.push(
            [firstButton, firstButton.cloneNode(true)],
          );
        } else {
          cells.push(
            [firstButton],
          );
        }
      }
      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      originalContactBlock.replaceWith(resultTable);
    }
  });
};

export default {
  /**
   * preprocess-method in order to convert empty italic tags to span tags,
   * without the customizing the EDS-logic would remove those tags
   * @param document
   */
  preprocess: ({ document }) => {
    const italicTagIcons = document.querySelectorAll('i.flaticon');

    italicTagIcons.forEach((italicTagIcon) => {
      const { className } = italicTagIcon;
      const spanTag = document.createElement('span');
      spanTag.className = className;

      italicTagIcon.replaceWith(spanTag);
    });
  },
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
    handle4ColumnsGrid(main, document);
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
    handleNewsList(main, document, params);
    handleEventsList(main, document, params);
    handleContactBanner(main, document);

    WebImporter.rules.createMetadata(main, document);

    results.push({
      element: main,
      path: new URL(url).pathname,
    });

    return results;
  },
};
