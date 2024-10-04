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
  preprocessHrefLang,
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
  handleGallerySliders,
  handleTextBoxes,
  handleFilterAndRows,
  handleImagesInText,
  handleTextPic,
  handleBrs,
  handleContacts,
  handlePdfs,
  isEderGmbh,
  handleMp4s,
  handleTeaserRows,
  handleSideBySide,
  handleSup,
  handleReferenceRows,
  formatTableData,
  sanitizePathname,
  isEderStapler,
  isFeedstar,
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
    '.route-link',
    '.hidden',
    '.hidden-md',
    '.map-link',
    '.margin-map',
    '.legend',
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
    const mapDistance = shopAccordion.querySelector('p.gmap-distance');
    if (mapDistance) {
      mapDistance.remove();
    }

    const imagePlaceholder = shopAccordion.querySelector('img + img');

    if (imagePlaceholder) {
      imagePlaceholder.remove();
    }

    // extract sections of the original content
    const headlineSection = shopAccordion.querySelector('div.headline');
    const addressDetails = shopAccordion.querySelector('div.address-details');

    // extract contact-button and append it below the address-details
    const contactButton = shopAccordion.querySelector('div.contact-button, div.coa-button');

    if (contactButton) {
      addressDetails.append(contactButton);
    }

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

        let iconHTML = '';

        if (icon) {
          iconHTML = icon.innerHTML;
        }

        const text = phoneNumberRow.querySelector('div.col-xs-9');

        let paragraphHTML = '';

        if (text) {
          const paragraph = text.querySelector('p');

          paragraphHTML = paragraph.innerHTML;
        }

        phoneNumberRow.innerHTML = `${iconHTML} ${paragraphHTML}`;
      });

      // format openTimes
      const openTimeRows = openTimesDiv.querySelectorAll('div.col-xs-12');

      openTimeRows.forEach((openTimeRow) => {
        const firstEntry = openTimeRow.querySelector('div.col-xs-3');
        const secondEntry = openTimeRow.querySelector('div.col-xs-9');

        if (firstEntry && secondEntry) {
          // make first entry bold
          const boldFirstEntry = document.createElement('strong');
          boldFirstEntry.append(firstEntry.innerText);

          openTimeRow.innerHTML = `${boldFirstEntry.outerHTML} ${secondEntry.innerText}`;
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
      let name;
      // names to look for - priority: "last match wins"
      const namesToCheck = [
        'EDER LANDTECHNIK',
        'AGRATEC Landtechnik',
        'AGRATEC LANDTECHNIKZENTRUM',
        'EDER Baumaschinen',
        'RTK-Experten',
        'Daniel Strehle',
        'Klaus Mayer',
        'Johann Pritzl',
      ];

      // check if name can be extracted from the text
      namesToCheck.forEach((nameToCheck) => {
        if (originalContactBlock.innerText.includes(nameToCheck)) {
          name = nameToCheck;
        }
      });

      if (name) {
        names = [name];
      }
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

/**
 * Method to replace Typo3-forms by stub of Embed-block
 * @param main
 * @param document
 */
export const handleForm = (main, document) => {
  const form = main.querySelector('form');

  if (form) {
    const result = document.createElement('div');

    // get h1 if there is any
    const h1 = document.querySelector('h1');

    if (h1) {
      result.append(h1);
    }

    // replace <form> from Typo3 by Embed-Block that must be manually filled
    const cells = [
      ['Embed'],
      ['TODO'],
    ];

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    result.append(resultTable);

    form.replaceWith(result);

    // remove sidebar (if there is any)
    const sidebar = main.querySelector('div.news-sidebar');
    if (sidebar) {
      sidebar.remove();
    }
  }
};

/**
 * Handle metrics-box from Typo3 by replacing it by the metrics variation of the Columns block
 * @param main
 * @param document
 */
export const handleMetricsColumns = (main, document) => {
  const metricBox = main.querySelector('div.metric-box');

  if (metricBox) {
    const cells = [
      ['Columns (metrics)'],
    ];

    const columns = metricBox.querySelectorAll('div.col-sm-4');

    // represents one line of entries in the result-table
    let resultLine = [];

    columns.forEach((column) => {
      const metricHeader = column.querySelector('div.metric-header');
      const metricDescription = column.querySelector('div.metric-description');

      const headerParagraph = document.createElement('p');
      headerParagraph.append(metricHeader);

      const descriptionParagraph = document.createElement('p');
      descriptionParagraph.append(metricDescription);

      const entry = document.createElement('div');
      entry.append(metricHeader);
      entry.append(metricDescription);

      resultLine.push(entry);

      // if 3 entries are reached
      if (resultLine.length > 2) {
        // add line to cell-array
        cells.push(resultLine);
        // create a new empty line for the next entries
        resultLine = [];
      }
    });

    // add possible, remaining entries to cell-array
    if (resultLine.length > 0) {
      cells.push(resultLine);
    }

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);
    formatTableData(resultTable, 'center');

    metricBox.replaceWith(resultTable);
  }
};

/**
 * Handle different version of Contact-block that contains both text and links,
 * but no contact-person
 * @param main
 * @param document
 */
export const handleFeedstarContact = (main, document) => {
  const originalBlock = main.querySelector('div.element-dce_dceuid29');

  if (originalBlock) {
    const textOnlyBlock = originalBlock.cloneNode(true);

    // extract the links from the original block
    const links = originalBlock.querySelectorAll('a');

    const firstLink = links[0];
    const secondLink = links[1];

    // only continue if there are exactly two links
    if (links.length === 2) {
      // remove links from the text-only block
      const linksInText = textOnlyBlock.querySelectorAll('a');

      linksInText.forEach((linkInText) => {
        linkInText.remove();
      });

      // remove classes text-center from content to avoid collision with centered Columns later-on
      const centeredElements = textOnlyBlock.querySelectorAll('.text-center');

      centeredElements.forEach((centeredElement) => {
        centeredElement.className = '';
      });

      const cells = [
        ['Columns'],
        [textOnlyBlock],
        [firstLink, secondLink],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      formatTableData(resultTable, ['center', 'right', 'left']);

      originalBlock.replaceWith(resultTable);
    }
  }
};

export const handleProfiContact = (main, document) => {
  const originalBlocks = main.querySelectorAll('div.ge_three_columns');

  originalBlocks.forEach((originalBlock) => {
    // extract the links from the original block
    const links = originalBlock.querySelectorAll('a');

    if (links.length === 2) {
      const firstLink = links[0];
      const secondLink = links[1];

      const cells = [
        ['Columns'],
        [firstLink, secondLink],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      formatTableData(resultTable, ['right', 'left']);

      originalBlock.replaceWith(resultTable);
    }
  });
};

/**
 * Replace <span>-tags with class "eder" by bold text
 * @param main
 * @param document
 */
export const handleClassEderSpans = (main, document) => {
  const ederSpans = main.querySelectorAll('span.eder');

  ederSpans.forEach((ederSpan) => {
    const content = ederSpan.innerHTML;

    // avoid adding <strong>-tags into each other
    if (!content.includes('strong')) {
      const boldElement = document.createElement('strong');
      boldElement.append(content);

      ederSpan.replaceWith(boldElement);
    }
  });
};

/**
 * Replace small-text Content by EDS Small-Print Block
 * @param main
 * @param document
 */
export const handleSmallPrint = (main, document) => {
  const smallTextSpans = main.querySelectorAll('span.small.text-muted');

  smallTextSpans.forEach((smallTextSpan) => {
    const result = document.createElement('div');
    const { childNodes } = smallTextSpan;

    // iterate child-nodes
    childNodes.forEach((childNode) => {
      // avoid <br>-tags, as they do not work properly EDS
      if (childNode.tagName !== 'BR') {
        // build <p> tag around each line of text
        const paragraph = document.createElement('p');
        paragraph.append(childNode);

        result.append(paragraph);
      }
    });

    const cells = [
      ['Small-Print'],
      [result],
    ];

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    smallTextSpan.replaceWith(resultTable);
  });
};

/**
 * Convert variant-cards from Typo3 to EDS Variants-Block
 * @param main
 * @param document
 */
export const handleVariants = (main, document) => {
  const variantCards = main.querySelectorAll('div.variant-card-content');

  variantCards.forEach((variantCard) => {
    const productTitle = variantCard.querySelector('p.product-title');

    // extract percentage from the styling
    const productEfficiencyDiv = variantCard.querySelector('div.product-efficiency-value');
    const efficiencyValue = productEfficiencyDiv.getAttribute('style').replace('width: ', '');

    const listPoints = variantCard.querySelectorAll('ul.variant-listpoints');

    const cells = [
      ['Variants'],
      [productTitle],
      [''],
      [efficiencyValue],
      [listPoints[0]],
      [listPoints[1] || ''],
    ];

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    variantCard.replaceWith(resultTable);
  });
};

/**
 * Add userlike-Block if there was any in Typo3.
 * @param main
 * @param document
 * @param params
 */
export const handleUserlike = (main, document, params) => {
  const { userlikeKey } = params;

  // check for userlike-key, but avoid adding it to individual pages at feedstar
  if (userlikeKey && !isFeedstar(params)) {
    const cells = [
      ['Thirdparty'],
      ['Userlike', userlikeKey],
    ];

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    main.append(resultTable);
  }
};

/**
 * Replace centered text by Columns-Block with centered formatting
 * @param main
 * @param document
 * @param params
 */
export const handleTextCentered = (main, document, params) => {
  // execute conversion only for eder-stapler, as it might cause side effects on the other domains
  if (isEderStapler(params)) {
    const centeredElements = document.querySelectorAll('p.text-center, h3.text-center');

    if (centeredElements.length > 1) {
      const centeredCells = [
        ['Columns'],
      ];

      let elementsCount = 0;

      centeredElements.forEach((centeredElement) => {
        // add clone of original entry to avoid any issues with replaceWith later-on
        centeredCells.push([centeredElement.cloneNode(true)]);

        // remove all entries, but not the last one
        if (elementsCount < centeredElements.length - 1) {
          centeredElement.remove();
        }

        elementsCount += 1;
      });

      // replace last Block
      const centeredResultTable = WebImporter.DOMUtils.createTable(centeredCells, document);

      formatTableData(centeredResultTable, 'center');

      const lastCenteredElement = centeredElements[centeredElements.length - 1];
      lastCenteredElement.replaceWith(centeredResultTable);
    }
  }
};

export default {
  /**
   * preprocess-method: access data before it is removed by the EDS-logic later-on
   * @param document
   * @param params
   */
  preprocess: ({ document, params }) => {
    // convert empty italic tags to span tags
    const italicTagIcons = document.querySelectorAll('i.flaticon');

    italicTagIcons.forEach((italicTagIcon) => {
      const { className } = italicTagIcon;
      const spanTag = document.createElement('span');
      spanTag.className = className;

      italicTagIcon.replaceWith(spanTag);
    });

    // check for Userlike-script in Document
    const scripts = document.querySelectorAll('script');

    scripts.forEach((script) => {
      const src = script.getAttribute('src');

      if (src && src.startsWith('https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/')) {
        // extract id from code
        const urlSections = src.split('/');

        const originalFilename = urlSections[urlSections.length - 1];

        // set userlikeKey to params-array, so it can be accessed by the transform-method
        params.userlikeKey = originalFilename.replace('.js', '');
      }
    });

    // extract href-lang x-default value from HTML-head
    preprocessHrefLang(document, params);
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

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    // handle possible internal links to PDF-documents
    handlePdfs(main, url, baseUrl, results);

    handleMp4s(main, url, baseUrl, results);

    // handle content of the document itself
    removeGenericContent(main);

    // handle image-slider before modifying image-urls in general
    handleGallerySliders(main, document, baseUrl);

    // handle images for all other imports that follow
    handleImages(main);

    handleClassEderSpans(main, document);
    handleForm(main, document);
    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handleFeedstarContact(main, document);
    handleProfiContact(main, document);
    handle2ColumnsGrid(main, document);
    handle3ColumnsGrid(main, document);
    handle4ColumnsGrid(main, document);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);
    handleTextBoxes(main, document);
    handleFilterAndRows(main, document, params);
    handleTeaserRows(main, document);
    handleImagesInText(main, document);
    handleTextPic(main, document);
    handleContacts(main, document);
    handleBlockquotes(main, document);
    handleShopData(main, document);
    handleNewsList(main, document, params);
    handleEventsList(main, document, params);
    handleContactBanner(main, document);
    handleSup(main, document);
    handleMetricsColumns(main, document);
    handleReferenceRows(main, document, params);
    handleSmallPrint(main, document);
    handleVariants(main, document);
    handleTextCentered(main, document, params);

    // handle <br> after the Blocks, as they only work outside of them
    handleBrs(main, document);

    handleSidebar(main, document);

    // handle side-by-side cases at last to check for converted EDS Markup
    handleSideBySide(main, document);

    // add possible userlike-Block at the very last
    handleUserlike(main, document, params);

    // get regular metadata as its originally done in WebImporter.rules.createMetadata
    const meta = WebImporter.Blocks.getMetadata(document);

    // check if a href-lang key was set by the preprocess-method
    if (params.hreflangKey) {
      meta.key = params.hreflangKey;
    }

    // create table for metadata and append it like it's done in WebImporter.rules.createMetadata
    if (Object.keys(meta).length > 0) {
      const block = WebImporter.Blocks.getMetadataBlock(document, meta);
      main.append(block);
    }

    // work-around for home-page (in case we want to take some data out of it)
    let { pathname } = new URL(url);

    if (pathname === '/') {
      pathname = '/index';
    }

    results.push({
      element: main,
      path: sanitizePathname(pathname),
    });

    return results;
  },
};
