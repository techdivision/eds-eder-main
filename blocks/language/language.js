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

import { defaultLanguage } from '../../scripts/defaults.js';
import {
  getCurrentLanguage,
  getUrlForLanguage,
  setAvailableLanguages,
} from '../../scripts/i18n.js';

function getLanguageData(block) {
  const languages = {};
  [...block.children].forEach((row) => {
    const key = row.children.item(0)
      .querySelector('p').innerHTML;
    const name = row.children.item(1)
      .querySelector('p').innerHTML;
    const label = row.children.item(2)
      .querySelector('p').innerHTML;
    const image = row.children.item(3)
      .querySelector('img').src;

    languages[key] = {
      name,
      label,
      image,
    };
  });
  return languages;
}

function addLanguageItems(languageSelectorList, possibleLanguagesList) {
  Object.entries(possibleLanguagesList)
    .forEach((language) => {
      const languageSite = getUrlForLanguage(language[0]);
      const languageListItem = document.createElement('li');
      const languageSiteLink = document.createElement('a');

      const urlKey = language[0] === defaultLanguage ? '' : language[0];
      languageSiteLink.href = languageSite || `/${urlKey}`;
      const img = document.createElement('img');
      img.src = language[1].image;

      const textSpan = document.createElement('span');
      textSpan.innerHTML = language[1].name;

      languageSiteLink.append(img);
      languageSiteLink.append(textSpan);
      languageListItem.append(languageSiteLink);
      languageSelectorList.append(languageListItem);
    });
}

export default async function decorate(block) {
  const possibleLanguages = getLanguageData(block);
  block.innerHTML = '';

  const currentLanguage = getCurrentLanguage();

  const currentLanguageImage = document.createElement('img');
  currentLanguageImage.src = possibleLanguages[currentLanguage].image;
  block.append(currentLanguageImage);

  const currentLanguageText = document.createElement('p');
  currentLanguageText.innerHTML = possibleLanguages[currentLanguage].label;
  block.append(currentLanguageText);

  const languageSelectorList = document.createElement('ul');
  languageSelectorList.classList.add('language-list');
  block.append(languageSelectorList);

  document.addEventListener('changedLanguages', () => {
    languageSelectorList.innerHTML = '';
    addLanguageItems(languageSelectorList, possibleLanguages);
  });
  setAvailableLanguages(Object.keys(possibleLanguages));
  return block;
}
