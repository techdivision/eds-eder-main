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

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { loadPlaceholders, ts } from '../../scripts/i18n.js';
import { addBodyClass, getCurrentUrl } from '../../scripts/helpers.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button')
        .focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {String} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = 'false') {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggle the entire nav
 *
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param [button] The button element
 * @param {*} [forceExpanded] Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, button, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  navSections.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', '0');
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Wrap text nodes in span-Tags
 *
 * @param container
 */
function wrapTextNodes(container) {
  if (container) {
    container.forEach((item) => {
      const textNodes = Array.from(item.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 1);

      textNodes.forEach((node) => {
        const span = document.createElement('span');
        node.after(span);
        span.appendChild(node);
      });
    });
  }
}

/**
 * Build the basic flyout navigation functionality
 *
 * @param nav
 * @param navSections
 */
function buildBasicFlyoutNav(nav, navSections) {
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });

    wrapTextNodes(navSections.querySelectorAll('li'));
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > a');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  const menuSpan = menuItem.querySelector(':scope > span');
  if (menuSpan) {
    return menuSpan.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

/**
 * Build breadcrumbs from nav tree
 *
 * @param {HTMLElement} nav
 * @returns {*[]}
 */
function buildBreadcrumbsFromNavTree(nav) {
  const crumbs = [];
  const currentUrl = getCurrentUrl();
  const homeUrl = document.querySelector('.nav-logo a').href;

  let menuItem = Array.from(nav.querySelectorAll('a'))
    .find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({
        title: getDirectTextContent(menuItem),
        url: link ? link.href : null,
      });

      menuItem = menuItem.closest('ul')
        ?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({
      title: getMetadata('og:title'),
      url: currentUrl,
    });
  }

  const homePlaceholder = ts('Home');
  crumbs.unshift({
    title: homePlaceholder,
    url: homeUrl,
  });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

/**
 * Build breadcrumbs
 *
 * @param {HTMLElement} breadcrumbsElement
 * @returns {void}
 */
function buildBreadcrumbs(breadcrumbsElement) {
  const crumbs = buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'));

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = item.title;
      li.append(span);
    }
    return li;
  }));

  breadcrumbsElement.append(ol);
}

/**
 * Toggle submenu
 *
 * @param {Event} e
 * @param {HTMLElement} child
 */
function toggleSubmenu(e, child) {
  e.stopPropagation();

  child.classList.toggle('is-visible');
}

/**
 * Mobile menu toggle behaviour
 *
 * @param navContainer
 */
function mobileMenu(navContainer) {
  const children = navContainer.querySelectorAll(':scope > li');

  if (!isDesktop.matches && navContainer) {
    if (children) navContainer.classList.add('mobile-menu');

    children.forEach((child) => {
      child.addEventListener('click', (e) => toggleSubmenu(e, child));
    });
  } else {
    if (children) navContainer.classList.remove('mobile-menu');

    children.forEach((child) => {
      child.removeEventListener('click', (e) => toggleSubmenu(e, child));
    });
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // append empty breadcrumb element to reserve space (CLS)
  const breadcrumbElement = document.createElement('nav');
  breadcrumbElement.classList.add('breadcrumbs');
  if (getMetadata('breadcrumbs')
    .toLowerCase() === 'true') {
    const main = document.getElementsByTagName('main')[0];
    const breadcrumbSection = document.createElement('div');
    breadcrumbSection.classList.add('section', 'section-breadcrumbs');
    breadcrumbSection.append(breadcrumbElement);
    main.prepend(breadcrumbSection);
    addBodyClass('has-breadcrumbs');
  }

  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, getCurrentUrl()).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['logo', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // link for logo
  const navLogo = nav.querySelector('.nav-logo');
  const logoLink = navLogo.querySelector('.button');
  if (logoLink) {
    logoLink.className = '';
    logoLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  buildBasicFlyoutNav(nav, navSections);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections, hamburger));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, hamburger, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, hamburger, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // load brand nav as fragment and create structure
  const brandNavMeta = getMetadata('brand-nav');
  const brandNavPath = brandNavMeta ? new URL(brandNavMeta, getCurrentUrl()).pathname : '/brand-nav';
  const preHeader = document.createElement('div');
  preHeader.className = 'pre-header';
  nav.append(preHeader);
  const brandNavFragment = await loadFragment(brandNavPath);
  while (brandNavFragment.firstElementChild) preHeader.append(brandNavFragment.firstElementChild);

  // init brand nav flyout and mobile nav
  const brandNav = nav.querySelector('.pre-header .section');
  const chevron = document.createElement('div');
  chevron.classList.add('nav-chevron');
  chevron.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-chevron-icon"></span>
    </button>`;
  chevron.addEventListener('click', () => toggleMenu(preHeader, brandNav, chevron));
  nav.prepend(chevron);

  buildBasicFlyoutNav(nav, brandNav);

  const mobilePreHeaderNav = nav.querySelector('.pre-header .section .default-content-wrapper > ul');
  mobilePreHeaderNav.addEventListener('click', () => toggleMenu(preHeader, brandNav, chevron));
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(preHeader, brandNav, chevron, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(preHeader, brandNav, chevron, isDesktop.matches));

  // click event for mobile menu behaviour
  mobileMenu(nav.querySelector('.pre-header .section .default-content-wrapper > ul > li > ul'));
  mobileMenu(nav.querySelector('.nav-sections .default-content-wrapper > ul'));

  isDesktop.addEventListener('change', () => mobileMenu(nav.querySelector('.pre-header .section .default-content-wrapper > ul > li > ul')));
  isDesktop.addEventListener('change', () => mobileMenu(nav.querySelector('.nav-sections .default-content-wrapper > ul')));

  // load breadcrumbs
  if (getMetadata('breadcrumbs')
    .toLowerCase() === 'true') {
    loadPlaceholders()
      .then(() => buildBreadcrumbs(breadcrumbElement));
  }
}
