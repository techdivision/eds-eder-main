// noinspection JSUnusedGlobalSymbols,JSUnresolvedReference

import { loadThirdPartyBundle } from '../../scripts/load-resource.js';
import { decorateLinkedPictures } from '../../scripts/scripts.js';

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
    // eslint-disable-next-line no-undef,no-new
    new Swiper(swiper, {
      slidesPerView: 3,
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
          slidesPerView: 5,
        },
      },
    });
  });
}
