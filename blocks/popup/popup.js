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

import { createModal } from '../modal/modal.js';
import { hasUrlParam } from '../../scripts/helpers.js';

/**
 * @type {string}
 */
const shownPopupsLocalStorageKey = 'shown-popups';

/**
 * Generate element ID
 *
 * @param {HTMLElement} element
 * @returns {string}
 */
function generateElementId(element) {
  const content = element.innerHTML;
  const hash = content
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % Number.MAX_SAFE_INTEGER, 0);
  return hash.toString(16)
    .padStart(16, '0')
    .slice(-16);
}

/**
 * Get shown popups
 *
 * @returns {Array}
 */
function getShownPopups() {
  return JSON.parse(localStorage.getItem(shownPopupsLocalStorageKey)) || [];
}

/**
 * Set popups as shown
 *
 * @param {string} elementId
 */
function setPopupAsShown(elementId) {
  const shownPopups = getShownPopups();
  if (!shownPopups.includes(elementId)) {
    shownPopups.push(elementId);
    localStorage.setItem(shownPopupsLocalStorageKey, JSON.stringify(shownPopups));
  }
}

/**
 * Check if popup has already been shown
 *
 * @param {string} uniqueId
 * @returns {boolean}
 */
function popupWasShown(uniqueId) {
  return !hasUrlParam('show-popups') && getShownPopups()
    .includes(uniqueId);
}

/**
 * Show popup
 *
 * @param {NodeList} modalContent
 * @param {boolean} once
 * @returns {Promise}
 */
async function generatePopup(modalContent, once) {
  const {
    block,
    showModal,
  } = await createModal(modalContent);
  if (once) {
    const elementId = generateElementId(block);
    if (!popupWasShown(elementId)) {
      showModal();
      setPopupAsShown(elementId);
    }
  } else {
    showModal();
  }
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const modalContent = block.cloneNode(true).childNodes;
  block.innerHTML = '';

  generatePopup(modalContent, block.classList.contains('once'))
    .then();
}
