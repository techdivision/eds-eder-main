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

import { getCurrentUrl } from './helpers.js';
import { defaultTenant } from './defaults.js';

/**
 * Tenant list
 *
 * @type {Object}
 */
const tenants = {
  // FIXME remove next line, just for testing
  'eder-main': 'https://main--eds-eder-main--techdivision.hlx.live/',
  [defaultTenant]: 'https://main--eds-eder-gmbh--techdivision.hlx.live/',
  'eder-landtechnik': 'https://main--eds-eder-landtechnik--techdivision.hlx.live/',
  'agratec-salching': 'https://main--eds-agratec-salching--techdivision.hlx.live/',
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
  if (tenantBaseUrl.includes('.hlx.live')) {
    if (getCurrentUrl().includes('.hlx.page')
      || getCurrentUrl().includes('localhost')) {
      tenantBaseUrl = tenantBaseUrl.replace('.hlx.live', '.hlx.page');
    }
  }

  // check path
  const normalizedPath = path || '';

  // return URL
  return `${tenantBaseUrl.replace(/\/+$/, '')}/${normalizedPath.replace(/^[.\/]+/, '')}`;
}

export {
  getTenants,
  getTenantUrl,
};
