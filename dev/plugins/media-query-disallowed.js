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

// eslint-disable-next-line import/no-extraneous-dependencies
const stylelint = require('stylelint');

const ruleName = 'plugin/media-query-disallowed';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: 'Only width >= media queries are allowed',
});

const pluginRule = () => (root, result) => {
  root.walkAtRules('media', (atRule) => {
    if (!/\(width\s*>=\s*\d+px\)/.test(atRule.params)) {
      stylelint.utils.report({
        message: messages.rejected,
        node: atRule,
        result,
        ruleName,
      });
    }
  });
};

module.exports = stylelint.createPlugin(ruleName, pluginRule);
module.exports.ruleName = ruleName;
module.exports.messages = messages;
