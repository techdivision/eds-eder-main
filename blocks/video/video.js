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

/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

function embedYoutube(url, replacePlaceholder, autoplay) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (replacePlaceholder || autoplay) {
    const suffixParams = {
      autoplay: '1',
      mute: autoplay ? '1' : '0',
      controls: autoplay ? '0' : '1',
      disablekb: autoplay ? '1' : '0',
      loop: autoplay ? '1' : '0',
      playsinline: autoplay ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, replacePlaceholder, autoplay) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (replacePlaceholder || autoplay) {
    const suffixParams = {
      autoplay: '1',
      background: autoplay ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, replacePlaceholder, autoplay) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.dataset.loading = 'true';
  video.addEventListener('loadedmetadata', () => delete video.dataset.loading);
  if (autoplay || replacePlaceholder) {
    video.setAttribute('autoplay', '');
    if (autoplay) {
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      video.removeAttribute('controls');
      video.addEventListener('canplay', () => {
        video.muted = true;
        video.play()
          .then();
      });
    }
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.')
    .pop()}`);
  video.append(sourceEl);

  return video;
}

function embedTikTok(url) {
  let embedLink = url;
  let videoId;
  if (!url.includes('embed')) {
    [, videoId] = url.split('video/');
    embedLink = `https://www.tiktok.com/embed/v2/${videoId}`;
  } else {
    [, videoId] = url.split('v2/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<blockquote class="tiktok-embed"
      style="max-width: 605px;min-width: 325px;"
      cite="${url}" data-video-id="${videoId}">
      <iframe src="${embedLink}"
      style="width: 100%; height: 739px; display: block; visibility: unset; max-height: 739px;"
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
      title="Content from TikTok" loading="lazy"></iframe>
    </blockquote>`;
  return temp.children.item(0);
}

const loadVideoEmbed = (block, link, replacePlaceholder, autoplay) => {
  if (block.dataset.embedIsLoaded) {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');
  const isMp4 = link.includes('.mp4');
  const isTikTok = link.includes('tiktok');

  let embedEl;
  if (isYoutube) {
    embedEl = embedYoutube(url, replacePlaceholder, autoplay);
  } else if (isVimeo) {
    embedEl = embedVimeo(url, replacePlaceholder, autoplay);
  } else if (isMp4) {
    embedEl = getVideoElement(link, replacePlaceholder, autoplay);
  } else if (isTikTok) {
    embedEl = embedTikTok(link);
  }
  block.replaceChildren(embedEl);

  block.dataset.embedIsLoaded = 'true';
};

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a').href;
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.innerHTML = '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>';
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadVideoEmbed(block, link, true, false);
    });
    block.append(wrapper);
  } else {
    block.classList.add('lazy-loading');
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadVideoEmbed(block, link, false, block.classList.contains('autoplay'));
        block.classList.remove('lazy-loading');
      }
    });
    observer.observe(block);
  }
}
