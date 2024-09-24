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

import { isLocal, isTest } from './helpers.js';
import { defaultTenant } from './defaults.js';

/**
 * Tenant list
 *
 * @type {Object}
 */
const tenants = {
  [defaultTenant]: 'https://main--eds-eder-gmbh--techdivision.aem.live/',
  'agratec-salching': 'https://main--eds-agratec-salching--techdivision.aem.live/',
  'eder-anhaenger': 'https://main--eds-eder-anhaenger--techdivision.aem.live/',
  'eder-baumaschinen': 'https://main--eds-eder-baumaschinen--techdivision.aem.live/',
  'eder-kommunal': 'https://main--eds-eder-kommunal--techdivision.aem.live/',
  'eder-landtechnik': 'https://main--eds-eder-landtechnik--techdivision.aem.live/',
  'eder-profi': 'https://main--eds-eder-profi--techdivision.aem.live/',
  'eder-stalltechnik': 'https://main--eds-eder-stalltechnik--techdivision.aem.live/',
  'eder-stapler': 'https://main--eds-eder-stapler--techdivision.aem.live/',
  feedstar: 'https://main--eds-feedstar--techdivision.aem.live/',
  lelycenterinbayern: 'https://main--eds-lelycenterinbayern--techdivision.aem.live/',
};

/**
 * Get all tenant keys
 *
 * @returns {string[]}
 */
function getTenants() {
  return Object.keys(tenants);
}

/**
 * Ensure a tenant exists
 *
 * @param {string} tenant
 * @returns {boolean}
 */
function ensureTenantExists(tenant) {
  if (!tenants[tenant]) {
    throw new Error(`There is no tenant ${tenant}`);
  }
  return true;
}

/**
 * Get tenant URL
 *
 * @param {string} tenant
 * @param {string} [path]
 * @returns {string}
 */
function getTenantUrl(tenant, path) {
  // ensure tenant exists
  ensureTenantExists(tenant);

  // get paths
  let tenantBaseUrl = tenants[tenant];

  // set environment
  if (tenantBaseUrl.includes('.aem.live')) {
    if (isLocal() || isTest()) {
      tenantBaseUrl = tenantBaseUrl
        .replace('.aem.live', '.aem.page');
    }
  }

  // check path
  const normalizedPath = path || '';

  // return URL
  return `${tenantBaseUrl.replace(/\/+$/, '')}/${normalizedPath.replace(/^[./]+/, '')}`;
}

export {
  getTenants,
  getTenantUrl,
};
