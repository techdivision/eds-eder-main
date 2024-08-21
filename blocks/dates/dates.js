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

import { getDayName, getTime } from '../../scripts/helpers.js';
import { loadPlaceholders, ts } from '../../scripts/i18n.js';

export default async function decorate(block) {
  await loadPlaceholders();
  const dates = block.querySelectorAll(':scope p');

  dates.forEach((date, i) => {
    const dateString = date.textContent;
    const day = document.createElement('div');
    day.classList.add('date');
    day.textContent = `${getDayName(dateString)}, ${dateString.split(' ')[0]}`;
    date.textContent = '';
    date.prepend(day);

    let startOrEnd = ts('End:');
    if (i === 0) {
      startOrEnd = ts('Start:');
    }

    const time = document.createElement('div');
    time.classList.add('time');
    time.textContent = `${startOrEnd} ${getTime(dateString)}`;

    date.append(time);
  });
}
