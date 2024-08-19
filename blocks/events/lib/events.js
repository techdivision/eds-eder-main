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

import { convertDate, getReadableDate } from '../../../scripts/helpers.js';
import { defaultDateTimeLocale } from '../../../scripts/defaults.js';
import { createOptimizedPicture } from '../../../scripts/aem.js';

/**
 * Check if event is relevant
 *
 * @param {Object|{startDate: string, endDate: string}} item
 */
function isCurrentEvent(item) {
  return !item.endDate || convertDate(item.endDate) >= new Date();
}

/**
 * Get date range
 *
 * @param {Object|{startDate: string, endDate: string}} item
 * @returns {string}
 */
function getDateRange(item) {
  const startDate = getReadableDate(convertDate(item.startDate));
  const endDate = getReadableDate(convertDate(item.endDate));
  const startTime = convertDate(item.startDate)
    .toLocaleTimeString(defaultDateTimeLocale, { timeStyle: 'short' });
  const endTime = convertDate(item.endDate)
    .toLocaleTimeString(defaultDateTimeLocale, { timeStyle: 'short' });

  if (startDate === endDate) {
    return `${startDate} ${startTime} - ${endTime}`;
  }
  return `${startDate} - ${endDate}`;
}

/**
 * Manipulate items
 *
 * @param {Array<{image: string, previewImage?: string, title: string}>} items
 * @returns {Array}
 */
function manipulateEventItems(items) {
  return items.filter((item) => {
    // check if event has ended
    if (!isCurrentEvent(item)) {
      return false;
    }

    // format date
    item.dateRange = getDateRange(item);

    // optimized image
    item.picture = createOptimizedPicture(
      item.previewImage || item.image,
      item.title,
      true,
      [{ width: '500' }],
    ).outerHTML;
    return true;
  });
}

export default manipulateEventItems;
