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

// noinspection HtmlDeprecatedAttribute

import { createOptimizedPicture } from '../../scripts/aem.js';
import { handleTranslate } from '../../scripts/i18n.js';

/**
 * Read config by row name
 * @param rows
 * @param name
 */
function getConfigRow(rows, name) {
  return rows.find((row) => row.children[0].textContent.toLowerCase() === name);
}

/**
 * Get youtube video ID
 *
 * @param {string} url
 * @returns {string|null}
 */
function getYouTubeVideoId(url) {
  if (!url) {
    return null;
  }
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

/**
 * Add an embedded YouTube video to a target
 * @param video
 * @param target
 */
function embedVideo(video, target) {
  // get youtube ID
  const youTubeId = getYouTubeVideoId(video.videoUrl);

  // embed video
  if (youTubeId) {
    // noinspection HtmlDeprecatedAttribute
    target.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${youTubeId}?playlist=${youTubeId}&autoplay=1&loop=1&controls=0&showinfo=0&autohide=1&rel=0&disablekb=1&modestbranding=1&mute=1"
            frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen="" allow="encrypted-media" loading="lazy"></iframe>`;
    handleTranslate(
      (translation) => {
        target.querySelector('iframe').title = translation;
      },
      'Hero Video',
    )
      .then();
  } else if (video.videoUrl) {
    target.innerHTML = `<video autoplay loop muted playsinline preload="none" poster="${video.poster?.src || ''}">
        <source src="${video.videoUrl}" type="video/mp4">
      </video>`;
  }

  // append poster
  if (video.poster && !target.querySelector('picture')) {
    target.append(createOptimizedPicture(video.poster.src, video.poster.alt || 'Hero Video'));
  }
}

export default function decorate(block) {
  const configRows = [...block.children];
  const mobileVideoRow = getConfigRow(configRows, 'mobile');
  const desktopVideoRow = getConfigRow(configRows, 'desktop');
  const overlayRow = getConfigRow(configRows, 'overlay');

  const [mobileVideo, desktopVideo] = [
    [mobileVideoRow, 'mobile'],
    [desktopVideoRow, 'desktop'],
  ].map(([row, typeHint]) => {
    const poster = row.querySelector('img');
    return {
      type: typeHint,
      videoUrl: row.querySelector('a')?.href,
      poster,
    };
  });

  const mobileVideoContainer = document.createElement('div');
  mobileVideoContainer.classList.add('video-container', 'video-mobile');
  mobileVideoRow.replaceWith(mobileVideoContainer);

  const desktopVideoContainer = document.createElement('div');
  desktopVideoContainer.classList.add('video-container', 'video-desktop');
  desktopVideoRow.replaceWith(desktopVideoContainer);

  if (overlayRow) {
    overlayRow.firstElementChild.remove();
    overlayRow.classList.add('overlay-content');
  }

  embedVideo(mobileVideo, mobileVideoContainer);
  embedVideo(desktopVideo, desktopVideoContainer);
}
