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

import { getMetadata } from './aem.js';
import { loadPlaceholders, ts } from './i18n.js';

/**
 * Translate content
 */
function translateContent() {
  const title = getMetadata('og:title');
  const translatedTitle = ts(title);

  document.querySelector('meta[property="og:title"]')
    .setAttribute('content', translatedTitle);
  document.title = translatedTitle;

  document.querySelectorAll('main [data-translate="true"]')
    .forEach((element) => {
      element.textContent = ts(element.textContent);
    });
}

/**
 * Prepare go back button
 */
function prepareGoBack() {
  if (document.referrer) {
    const {
      origin,
      pathname,
    } = new URL(document.referrer);
    if (origin === window.location.origin) {
      const backBtn = document.createElement('a');
      backBtn.classList.add('button', 'error-button-back');
      backBtn.href = pathname;
      backBtn.textContent = 'Go back';
      backBtn.title = 'Go back';
      backBtn.setAttribute('data-translate', 'true');
      const btnContainer = document.querySelector('.button-container');
      btnContainer.append(backBtn);
    }
  }
}

/**
 * Decorate
 */
function decorate() {
  prepareGoBack();
  loadPlaceholders()
    .then(translateContent);
}

decorate();
