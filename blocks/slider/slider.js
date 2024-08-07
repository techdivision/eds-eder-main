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

import { loadThirdPartyBundle } from '../../scripts/load-resource.js';

/**
 * Decorate slider block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // add slides to wrapper
  const swiperWrapper = document.createElement('div');
  swiperWrapper.classList.add('swiper-wrapper');
  [...block.children].forEach((child) => {
    child.classList.add('swiper-slide');
    swiperWrapper.append(child);
  });

  // add slider element
  const swiper = document.createElement('div');
  swiper.classList.add('swiper');
  swiper.append(swiperWrapper);
  block.append(swiper);

  // add navigation
  const prev = document.createElement('div');
  prev.classList.add('swiper-button-prev');
  block.append(prev);
  const next = document.createElement('div');
  next.classList.add('swiper-button-next');
  block.append(next);

  // load swiper
  loadThirdPartyBundle('swiper-bundle.min', () => {
    // set default values
    let slideNumberDesktop = 5;
    let slideNumberMobile = 3;

    block.classList.forEach((className) => {
      // handle class names like 'desktop-5-mobile-3', that define the number of slides displayed
      if (className.startsWith('desktop-')) {
        const slideNumbers = className.split('-mobile-');

        slideNumberDesktop = (slideNumbers[0]).replace('desktop-', '');

        slideNumberMobile = (slideNumbers[1]).trim();
      }
    });

    // eslint-disable-next-line no-undef,no-new
    new Swiper(swiper, {
      slidesPerView: slideNumberMobile,
      loop: true,
      autoplay: {
        enabled: block.classList.contains('autostart'),
      },
      navigation: {
        prevEl: prev,
        nextEl: next,
      },
      breakpoints: {
        900: {
          slidesPerView: slideNumberDesktop,
        },
      },
    });
  });
}
