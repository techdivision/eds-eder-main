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

/**
 * Determines the EDS base-url based on static mapping
 * @param params
 * @returns {*}
 */
export const determineEdsBaseUrl = (params) => {
  const urlMapping = {
    'https://www.eder-gmbh.de': 'https://main--eds-eder-gmbh--techdivision.hlx.page',
    'https://www.eder-landtechnik.de': 'https://main--eds-eder-landtechnik--techdivision.hlx.page',
    'https://www.agratec-salching.de': 'https://main--eds-agratec-salching--techdivision.hlx.page',
  };

  const originalUrl = new URL(params.originalURL);

  const urlToCheck = `${originalUrl.protocol}//${originalUrl.host}`;

  if (urlMapping[urlToCheck]) {
    return urlMapping[urlToCheck];
  }

  throw new Error(`There is no mapping for the base-url ${urlToCheck}`);
};

/**
 * Returns whether the given link from Typo3 should be a link in EDS
 * @param link
 * @returns {boolean}
 */
export const isButton = (link) => {
  // check for buttons that are defined at link level
  if (link.className.includes('btn-gray-ghost') || link.className.includes('btn-gray')) {
    return true;
  }

  const parent = link.parentElement;

  // no need to continue if there is no parent
  if (!parent) {
    return false;
  }

  if (parent.className.includes('coa-button') || parent.className.includes('offer-btn-wrapper')) {
    return true;
  }

  // return false in all other cases
  return false;
};

/**
 * Determines whether the given news or events entry should be imported for the given domain
 * @param entry
 * @param originalUrl
 * @returns {boolean}
 */
export const shouldBeImported = (entry, originalUrl) => {
  // mapping between the Typo3-urls and the section-names
  const urlMapping = {
    'https://www.eder-gmbh.de': ['Überall', 'Profitechnik'],
    'https://www.eder-landtechnik.de': 'Landtechnik',
    'https://www.agratec-salching.de': 'Agratec',
  };

  const urlToCheck = `${originalUrl.protocol}//${originalUrl.host}`;

  const targetSection = urlMapping[urlToCheck];

  // handling multiple assignment - set "Überall"
  const sectionList = entry.section.split(',');

  if (sectionList.length > 1) {
    entry.section = 'Überall';
  }

  // do not import if the section of the news does not match the section of the import
  if (entry.section !== targetSection && !targetSection.includes(entry.section)) {
    /* eslint-disable no-console */
    console.log(`This entry will not be imported, as its section '${entry.section}' does not match the section '${targetSection}' of the current import`);
    /* eslint-enable no-console */
    return false;
  }

  return true;
};

/**
 * Handle HTML-Table by adding the respective headline in order to mark them as an EDS table block
 * @param main
 * @param document
 */
export const handleTable = (main, document) => {
  const tables = main.querySelectorAll('table');

  tables.forEach((table) => {
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
  });
};

/**
 * Handle sidebar by converting its HTML-Markup to the EDS section-structure
 * @param main
 * @param document
 */
export const handleSidebar = (main, document) => {
  const originalSidebar = main.querySelector('div.news-sidebar');

  if (originalSidebar) {
    // create a copy of the original sidebar-block to work with later on
    const sidebar = originalSidebar.cloneNode(true);

    // add separator before the sidebar-content
    sidebar.prepend(document.createElement('hr'));

    // add metadata-table after sidebar-content
    const cells = [
      ['Section Metadata'],
      ['Style', 'sidebar'],
    ];

    const table = WebImporter.DOMUtils.createTable(cells, document);

    sidebar.append(table);

    // remove the original sidebar and add the new one at the very last position
    originalSidebar.remove();
    main.append(sidebar);
  }
};

/**
 * Handle icons by replacing their HTML-markup by the EDS-notation :iconname:
 */
export const handleIcons = (main) => {
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
export const handleImages = (main) => {
  const images = main.querySelectorAll('img');

  let parent;

  images.forEach((image) => {
    // use data-regular (= the original image) instead of src (= converted webp)
    const srcRegular = image.getAttribute('data-regular');

    if (srcRegular) {
      image.src = srcRegular;
    }

    // remove link around the image, as it would link to the Typo3 url-structure
    parent = image.parentElement;

    if (parent.tagName === 'A') {
      // eliminate the link's Markup
      parent.outerHTML = image.outerHTML;
    }
  });
};

/**
 * Handle links by making them absolute instead of relative, also converts buttons to EDS-markup
 * @param main
 * @param document
 * @param baseUrl
 */
export const handleLinks = (main, document, baseUrl) => {
  const links = main.querySelectorAll('a');

  if (links) {
    links.forEach((link) => {
      // make link absolute
      let href = link.getAttribute('href');

      // if the link does not have a target: replace it with the text of the link
      if (!href) {
        link.outerHTML = link.innerText;
        return;
      }

      // replace relative urls
      if (href.charAt(0) === '/') {
        link.setAttribute('href', baseUrl + href);
      }

      // replace http- by https-urls
      if (href.startsWith('http://')) {
        href = `https://${href.slice('7')}`;

        link.setAttribute('href', href);
      }

      // remove link from collapse links as they cause an error in Sharepoint
      if (href.startsWith('#collapse')) {
        link.outerHTML = link.innerText;
      }

      if (isButton(link)) {
        const linkText = link.innerText;

        // create a bold element to assign the original text to
        const boldElement = document.createElement('strong');

        boldElement.append(linkText);

        link.innerHTML = boldElement.outerHTML;
      }
    });
  }
};

/**
 * Handle 2-column grids by converting them to EDS half-width Cards
 * @param main
 * @param document
 */
export const handle2ColumnsGrid = (main, document) => {
  // get parent-element
  const parent = main.querySelector('div.products-new-mainpage');

  if (parent) {
    const result = document.createElement('div');

    // add headline to result, if there is any
    const headline = parent.querySelector('h2');

    if (headline) {
      result.append(headline);
    }

    // handle the product-entries itself
    const originalLinks = parent.querySelectorAll('a');

    if (originalLinks.length > 0) {
      const cells = [
        ['Cards (half-width)'],
      ];

      originalLinks.forEach((originalLink) => {
        // handle image
        const image = originalLink.querySelector('img');

        // handle content
        const originalContent = originalLink.querySelector('div.attributes');

        const newContent = document.createElement('div');

        const logo = originalContent.querySelector('img');
        const productHeadline = originalContent.querySelector('h3');
        const productDescription = originalContent.querySelector('p.description');

        /*
        In Typo3 the link is set on the entire container, instead it should go on "price",
        which is displayed as a link in Typo3
        */
        const productPrice = originalContent.querySelector('span.price');

        const newLink = document.createElement('a');
        newLink.href = originalLink.href;
        newLink.append(productPrice);

        newContent.append(productHeadline);
        newContent.append(productDescription);
        newContent.append(newLink);

        cells.push(
          [image, logo, newContent],
        );
      });

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      result.append(resultTable);
    }
    parent.replaceWith(result);
  }
};

/**
 * Handle 3-column grids by converting them to EDS third-width Card Blocks
 * @param main
 * @param document
 */
export const handle3ColumnsGrid = (main, document) => {
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
      const image = thirdWidthCard.querySelector('img');

      // check if there is any image present
      if (image) {
        // create a clone of the image-node to work with later-on
        const imageClone = image.cloneNode(true);

        // check whether image is within a link
        const imageParent = image.parentElement;

        if (imageParent.tagName === 'A') {
          // remove the parent, that includes the link
          imageParent.remove();
        } else {
          // remove only the image itself
          image.remove();
        }

        const heroText = thirdWidthCard.querySelector('div.category-heroimage');

        imageDiv.append(imageClone);

        if (heroText) {
          imageDiv.append(heroText);
        }

        cells.push(
          [imageDiv, thirdWidthCard],
        );
      } else {
        // Card with no image
        cells.push(
          [thirdWidthCard],
        );
      }
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    parent.replaceWith(resultTable);
  }
};

/**
 * Handle top-image by converting Typo3 hero-image into a regular image within the docx,
 * and putting the headline thereafter
 * @param main
 * @param document
 */
export const handleTopImage = (main, document) => {
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

/**
 * Handle iframes by converting them according to their url,
 * either into an EDS Video-Block (YouTube) or an EDS Embed-Block (Yumpu)
 * @param main
 * @param document
 */
export const handleIframes = (main, document) => {
  const iframes = main.querySelectorAll('iframe');

  if (iframes) {
    iframes.forEach((iframe) => {
      let src = iframe.getAttribute('src');

      // if there is no src check for data-src
      if (!src) {
        src = iframe.getAttribute('data-src');
      }

      // return if there was still no src found
      if (!src) {
        return;
      }

      let cells;

      // check for Youtube-urls
      if (src.startsWith('https://www.youtube.com/')) {
        const videoId = src.substring(30, 41);

        const url = `https://www.youtube.com/watch?v=${videoId}`;

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.innerText = url;

        cells = [
          ['Video'],
          [link],
        ];
        // check for yumpu-url
      } else if (src.startsWith('https://www.yumpu.com/') || src.startsWith('https://forms.office.com')) {
        const blockClasses = [];

        // handle height of iframe
        let height = iframe.getAttribute('height');

        if (height) {
          height = height.replace('px', '');

          blockClasses.push(`height-${height}`);
        }

        // handle width of iframe
        let width = iframe.getAttribute('width');

        if (width) {
          width = width.replace('px', '');
          blockClasses.push(`width-${width}`);
        }

        // build-up block name, including possible headlines
        let blockname = 'Embed';

        if (blockClasses.length > 0) {
          blockname = `${blockname}(${blockClasses.join(', ')})`;
        }

        // build-up link
        const link = document.createElement('a');
        link.innerText = src;
        link.setAttribute('href', src);

        cells = [
          [blockname],
          [link],
        ];
      }

      if (cells) {
        const resultTable = WebImporter.DOMUtils.createTable(cells, document);

        iframe.replaceWith(resultTable);
      }
    });
  }
};

export const handleAccordions = (main, document) => {
  const accordions = main.querySelectorAll('div.panel-group');

  if (accordions) {
    accordions.forEach((accordion) => {
      const cells = [
        ['Accordion'],
      ];

      const sections = accordion.querySelectorAll('div.panel');

      sections.forEach((section) => {
        const headline = section.querySelector('.panel-title');
        const content = section.querySelector('div.panel-body');

        // use innerHTML here to exclude the original headline-markup
        cells.push(
          [headline.innerHTML, content],
        );
      });

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      accordion.replaceWith(resultTable);
    });
  }
};

export const handleGallerySlider = (main, document, baseUrl) => {
  const gallerySlider = main.querySelector('div.flexslider');

  if (gallerySlider) {
    const cells = [
      ['Slider (Autostart, Desktop-1-Mobile-1)'],
    ];
    const slides = gallerySlider.querySelectorAll('li.item');

    slides.forEach((slide) => {
      let imageSrc = slide.querySelector('a').getAttribute('href');

      // make image-url relative in order to allow proper usage in EDS
      imageSrc = imageSrc.replace(baseUrl, '');

      const image = document.createElement('img');

      image.setAttribute('src', imageSrc);

      // use innerHTML here to exclude the original headline-markup
      cells.push(
        [image],
      );
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    gallerySlider.replaceWith(resultTable);
  }
};

export const handleTextBoxes = (main, document) => {
  const textBoxes = main.querySelectorAll('div.alert-danger');

  if (textBoxes) {
    textBoxes.forEach((textBox) => {
      const cells = [
        ['Text-Box (red)'],
        [textBox.innerHTML],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      textBox.replaceWith(resultTable);
    });
  }
};

export const handleFilterAndRows = (main, document) => {
  // get filter-block and product-rows, ids are used as there is no other possibility
  const filter = main.querySelector('div.element-dce_dceuid14');

  // use id here, as the elements do not have another way to identify them
  const rows = main.querySelectorAll('div.element-dce_dceuid12');

  let parent;

  const result = document.createElement('div');

  if (filter) {
    parent = filter.parentElement;

    // handle filter-block
    const images = filter.querySelectorAll('img.filter-img');

    const imagesParagraph = document.createElement('p');

    images.forEach((image) => {
      imagesParagraph.append(image);
    });

    const filterCells = [
      ['Filter'],
      ['PS', 'slider', 'power_min,power_max', '%minSliderValue - %maxSliderValue PS (%minSliderValueKW - %maxSliderValueKW KW)'],
      ['Marke', 'checkbox', 'brand', imagesParagraph],
    ];

    const filterResultTable = WebImporter.DOMUtils.createTable(filterCells, document);

    result.append(filterResultTable);
  }

  // handle rows with product data
  if (rows.length > 0) {
    const rowCells = [
      ['Rows'],
      ['', '', '', '', 'power_min', 'power_max', 'brand'],
    ];

    rows.forEach((row) => {
      // store parent
      parent = row.parentElement;

      // get the original-data from Typo3
      const originalImageDiv = row.querySelector('div.image');
      const originalContentDiv = row.querySelector('div.content');
      const originalRecommendDiv = row.querySelector('div.recommend');

      // perform modifications to original image-data
      const originalImages = originalImageDiv.querySelectorAll('img');

      // use the second image, if there is one (= the bigger mobile-image)
      const originalImage = originalImages[originalImages.length - 1];

      // create a new image tag in order to use the original jpg-value
      const resultImage = document.createElement('img');

      resultImage.src = originalImage.getAttribute('data-regular');

      // perform modifications to original content data
      const content = originalContentDiv;

      // extract logo
      const originalLogo = originalContentDiv.querySelector('img');

      // extract data-value from logo
      const brand = originalLogo.getAttribute('data-value');

      // build-up new logo in order to use 'data-regular' of the image
      const resultLogo = document.createElement('img');

      resultLogo.src = originalLogo.getAttribute('data-regular');
      resultLogo.alt = brand;

      // remove original logo from the content
      originalLogo.remove();

      // extract power-data
      let powerMin = originalContentDiv.querySelector('span[data-value=power-min]');

      if (powerMin) {
        powerMin = parseInt(powerMin.innerText, 10);
      } else {
        powerMin = '';
      }

      let powerMax = originalContentDiv.querySelector('span[data-value=power-max]');

      if (powerMax) {
        powerMax = parseInt(powerMax.innerText, 10);
      } else {
        powerMax = '';
      }

      // create own paragraph, add italic element around text of info-button
      const infoButton = originalContentDiv.querySelector('a.info-btn');

      const italicElement = document.createElement('em');
      italicElement.append(infoButton.innerHTML);

      const infoButtonParagraph = document.createElement('p');
      infoButtonParagraph.append(italicElement);

      infoButton.innerHTML = infoButtonParagraph.outerHTML;

      // create own paragraph, add bold element around to text of contact-button
      const contactButton = originalContentDiv.querySelector('a.contact-btn');

      const boldElement = document.createElement('strong');
      boldElement.append(contactButton.innerHTML);

      const contactButtonParagraph = document.createElement('p');
      contactButtonParagraph.append(boldElement);

      contactButton.innerHTML = contactButtonParagraph.outerHTML;

      // store modified data
      rowCells.push(
        [resultImage, resultLogo, content, originalRecommendDiv, powerMin, powerMax, brand],
      );
    });
    const rowResultTable = WebImporter.DOMUtils.createTable(rowCells, document);

    result.append(rowResultTable);

    parent.replaceWith(result);
  }
};

/**
 * Handle inline-images in text by creating the appropriate section-structure
 * @param main
 */
export const handleImagesInText = (main) => {
  // handle images right, text left
  const imageDivs = main.querySelectorAll('div.pull-right, div.pull-left');

  imageDivs.forEach((imageDiv) => {
    const parent = imageDiv.parentElement;

    const textDiv = parent.querySelector('div.intext-text');

    if (imageDiv && textDiv) {
      // convert classname
      const originalClassname = imageDiv.className;

      // EDS-classname - default value
      let edsClassname = 'images-inline-right';

      if (originalClassname && originalClassname.includes('pull-left')) {
        edsClassname = 'images-inline-left';
      }

      const sectionMarkupCells = [
        ['Section Metadata'],
        ['style', edsClassname],
      ];

      // build-up new image div, with only the images
      const resultImageDiv = document.createElement('div');

      const images = imageDiv.querySelectorAll('img');

      images.forEach((image) => {
        resultImageDiv.append(image);
      });

      const sectionMarkupTable = WebImporter.DOMUtils.createTable(sectionMarkupCells, document);

      // build-up new structure
      const result = document.createElement('div');
      result.append(document.createElement('hr'));
      result.append(resultImageDiv);
      result.append(textDiv);
      result.append(sectionMarkupTable);
      result.append(document.createElement('hr'));

      parent.replaceWith(result);
    }
  });
};

/**
 * Handle "textpic"-elements from Typo3, migrate them to EDS Columns-Block
 * @param main
 * @param document
 */
export const handleTextPic = (main, document) => {
  const textPicElements = main.querySelectorAll('div.element-textpic');

  textPicElements.forEach((textPicElement) => {
    const columns = textPicElement.querySelectorAll('div.col-sm-6');

    // avoid cases where there is only one column
    if (columns.length > 1) {
      const resultColumns = [];

      columns.forEach((column) => {
        resultColumns.push(column);
      });

      const resultCells = [
        ['Columns'],
        resultColumns,
      ];

      const resultTable = WebImporter.DOMUtils.createTable(resultCells, document);

      textPicElement.append(resultTable);
    }
  });
};

/**
 * Handle <br>-Tag, required because the EDS-import can not handle them properly out-of-the-box
 * @param main
 * @param document
 */
export const handleBrs = (main, document) => {
  const brs = main.querySelectorAll('br');

  brs.forEach((br) => {
    const pagraph = document.createElement('p');

    // set a non-breaking space as the only content of the paragraph
    pagraph.append('\xa0');

    br.outerHTML = pagraph.outerHTML;
  });
};

/**
 * Handle Contact-data by replacing it by the EDS Contacts-Block
 * @param main
 * @param document
 */
export const handleContacts = (main, document) => {
  // remove "Kontakt"-headline from Sidebar
  const sidebar = main.querySelector('div.news-sidebar');

  if (sidebar) {
    // unfortunately there are different Markups
    let contactHeadline = sidebar.querySelector('div.bodytext');

    if (!contactHeadline) {
      contactHeadline = sidebar.querySelector('h1');
    }

    // remove if a headline was found
    if (contactHeadline) {
      contactHeadline.remove();
    }
  }

  // use id here, as there is no other way of identification
  const contactBlocks = main.querySelectorAll('div.element-dce_dceuid2');

  let parent;

  if (contactBlocks.length > 0) {
    const contactCells = [
      ['Contacts'],
    ];

    contactBlocks.forEach((contactBlock) => {
      parent = contactBlock.parentElement;

      const name = contactBlock.querySelector('p.staff-headline').innerText;

      contactCells.push([name]);
    });

    const contactsResultTable = WebImporter.DOMUtils.createTable(contactCells, document);

    parent.replaceWith(contactsResultTable);
  }
};
