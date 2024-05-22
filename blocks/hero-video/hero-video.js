import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Read config by row name
 * @param rows
 * @param name
 */
function getConfigRow(rows, name) {
  return rows.find((row) => row.children[0].textContent.toLowerCase() === name);
}

/**
 * Add overlay content
 * @param overlay
 * @param anchor
 */
function decorateOverlay(overlay, anchor) {
  overlay.firstElementChild.remove();
  overlay.classList.add('overlay-content');
  if (anchor && anchor.children[1].textContent.length > 0) {
    anchor.firstElementChild.remove();
    anchor.classList.add('overlay-anchor');
    anchor.addEventListener('click', (e) => {
      const parentNode = e.target.closest('.hero-video-wrapper');
      const nav = document.getElementsByTagName('nav')[0];

      window.scrollTo({
        top: (parentNode.offsetTop + parentNode.offsetHeight) - nav.offsetHeight,
        behavior: 'smooth',
      });
    });
    overlay.append(anchor);
  } else {
    anchor.innerHTML = '';
  }
}

/**
 * Add an embedded YouTube video to a target
 * @param video
 * @param target
 */
function embedYoutube(video, target) {
  let videoKey = null;
  if (video.videoUrl) {
    const checkParam = video.videoUrl.lastIndexOf('?v=');
    const index = (checkParam < 0) ? video.videoUrl.lastIndexOf('/') : checkParam;
    const offset = (checkParam < 0) ? 1 : 3;
    videoKey = video.videoUrl.substring(index + offset);
  }
  const poster = (video.poster) ? createOptimizedPicture(video.poster.src) : null;
  if (videoKey) {
    target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoKey}?autoplay=1&loop=1&controls=0&showinfo=0&autohide=1&rel=0&playlist=wucRttS1ZjQ&disablekb=1&modestbranding=1&mute=1" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${video.hostname}" loading="lazy">
    </iframe>`;
  }
  if (!target.querySelector('picture')) {
    target.append(poster);
  }
}

export default function decorate(block) {
  const configRows = [...block.children];
  const mobileVideoRow = getConfigRow(configRows, 'mobile');
  const desktopVideoRow = getConfigRow(configRows, 'desktop');
  const overlayRow = getConfigRow(configRows, 'overlay');
  const anchorRow = getConfigRow(configRows, 'anchor');

  const [mobileVideo, desktopVideo] = [
    [mobileVideoRow, 'mobile'],
    [desktopVideoRow, 'desktop'],
  ].map(([row, typeHint]) => {
    const poster = row.querySelector('img');

    return {
      type: typeHint,
      videoUrl: row.querySelector('a')?.innerText,
      poster,
      title: (poster && poster.getAttribute('alt')) || 'hero video',
    };
  });

  const mobileVideoContainer = document.createElement('div');
  mobileVideoContainer.classList.add('video-mobile');
  mobileVideoRow.replaceWith(mobileVideoContainer);

  const desktopVideoContainer = document.createElement('div');
  desktopVideoContainer.classList.add('video-desktop');
  desktopVideoRow.replaceWith(desktopVideoContainer);

  const addVideos = (e) => {
    if (e.matches) {
      embedYoutube(mobileVideo, mobileVideoContainer);
    } else {
      embedYoutube(desktopVideo, desktopVideoContainer);
    }
  };

  if (overlayRow) {
    decorateOverlay(overlayRow, anchorRow);
  }

  const mql = window.matchMedia('only screen and (max-width: 900px)');
  mql.onchange = addVideos;
  addVideos(mql);
}
