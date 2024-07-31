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
import { getCurrentLanguage } from '../../scripts/i18n.js';
import { getMetadata } from '../../scripts/aem.js';

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

function addLanguageItems(languageSelectorList, possibleLanguagesList, languageSites) {
  Object.entries(possibleLanguagesList)
    .forEach((language) => {
      const languageSite = languageSites.find((site) => site.lang === language[0]);
      const languageListItem = document.createElement('li');
      const languageSiteLink = document.createElement('a');

      const urlKey = language[0] === defaultLanguage ? '' : language[0];
      languageSiteLink.href = languageSite ? languageSite.path : `/${urlKey}`;
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

  const key = getMetadata('key') || 'index';
  const currentLanguage = getCurrentLanguage();

  const currentLanguageImage = document.createElement('img');
  currentLanguageImage.src = possibleLanguages[currentLanguage].image;

  const currentLanguageText = document.createElement('p');
  currentLanguageText.innerHTML = possibleLanguages[currentLanguage].label;

  block.append(currentLanguageImage);
  block.append(currentLanguageText);

  const languageSelectorList = document.createElement('ul');
  languageSelectorList.classList.add('language-list', 'hidden');

  block.addEventListener('mouseover', () => {
    languageSelectorList.classList.remove('hidden');
  });

  block.addEventListener('mouseleave', () => {
    languageSelectorList.classList.add('hidden');
  });

  block.append(languageSelectorList);
  // Render default language select
  addLanguageItems(languageSelectorList, possibleLanguages, []);

  const response = await fetch('/query-index.json');
  if (!response.ok) {
    return null;
  }
  const sites = await response.json();
  const languageSites = sites.data.filter((site) => site.key === key);

  // Clear Language select and render again with fetch data
  languageSelectorList.innerHTML = '';
  addLanguageItems(languageSelectorList, possibleLanguages, languageSites);

  return block;
}
