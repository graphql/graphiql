/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
  },
  // https://github.com/sindresorhus/globals/blob/master/globals.json
  env: {
    atomtest: true,
    es6: true,
    node: true,
    browser: true,
    jest: true,
    'jest/globals': true,
  },

  extends: [
    'prettier',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],

  globals: {
    atom: false,
    document: false,
    window: false,
    monaco: true,
    Map: true,
    Set: true,
  },

  rules: {
    // Possible Errors (http://eslint.org/docs/rules/#possible-errors)
    'no-cond-assign': 1,
    'no-console': 1,
    'no-constant-condition': [1, { checkLoops: false }],
    'no-control-regex': 1,
    'no-debugger': 1,
    'no-dupe-args': 1,
    'no-dupe-keys': 1,
    'no-duplicate-case': 1,
    'no-empty-character-class': 1,
    'no-empty': [1, { allowEmptyCatch: true }],
    'no-ex-assign': 1,
    'no-extra-boolean-cast': 1,
    'no-extra-parens': 0,
    'no-func-assign': 1,
    'no-inner-declarations': 1,
    'no-invalid-regexp': 1,
    'no-irregular-whitespace': 1,
    'no-obj-calls': 1,
    'no-prototype-builtins': 0,
    'no-regex-spaces': 1,
    'no-sparse-arrays': 1,
    'no-template-curly-in-string': 0,
    'no-unexpected-multiline': 0, // prettier --list-different
    'no-unreachable': 1,
    'no-unsafe-finally': 1,
    'no-unsafe-negation': 1,
    'use-isnan': 1,
    'valid-jsdoc': 0,
    'valid-typeof': 'error',

    // Best Practices (http://eslint.org/docs/rules/#best-practices)
    'accessor-pairs': 1,
    'array-callback-return': 0,
    'block-scoped-var': 0,
    'class-methods-use-this': 0,
    complexity: 0,
    'consistent-return': 0,
    curly: 1,
    'default-case': 0,
    'dot-notation': 1,
    eqeqeq: [1, 'allow-null'],
    'guard-for-in': 0,
    'no-alert': 1,
    'no-await-in-loop': 1,
    'no-caller': 1,
    'no-case-declarations': 0,
    'no-div-regex': 1,
    'no-else-return': 0,
    'no-empty-function': 0,
    'no-empty-pattern': 1,
    'no-eq-null': 0,
    'no-eval': 1,
    'no-extend-native': 1,
    'no-extra-bind': 1,
    'no-extra-label': 1,
    'no-fallthrough': 1,
    'no-floating-decimal': 0, // prettier --list-different
    'no-global-assign': 1,
    'no-implicit-coercion': 1,
    'no-implicit-globals': 0,
    'no-implied-eval': 1,
    'no-invalid-this': 0,
    'no-iterator': 1,
    'no-labels': 1,
    'no-lone-blocks': 1,
    'no-loop-func': 0,
    'no-magic-numbers': 0,
    'no-multi-str': 0,
    'no-new-func': 1,
    'no-new-wrappers': 1,
    'no-new': 1,
    'no-octal-escape': 1,
    'no-octal': 1,
    'no-param-reassign': 1,
    'no-proto': 1,
    'no-redeclare': [1, { builtinGlobals: true }],
    'no-restricted-properties': 0,
    'no-return-assign': 1,
    'no-return-await': 1,
    'no-script-url': 1,
    'no-self-assign': 1,
    'no-self-compare': 1,
    'no-sequences': 1,
    'no-throw-literal': 1,
    'no-unmodified-loop-condition': 0,
    'no-unused-expressions': 0,
    'no-unused-labels': 1,
    'no-useless-call': 1,
    'no-useless-concat': 1,
    'no-useless-escape': 1,
    'no-useless-return': 0,
    'no-void': 1,
    'no-warning-comments': 0,
    'no-with': 1,
    radix: 1,
    'require-await': 0,
    // 'require-await': 1,
    'vars-on-top': 0,
    yoda: 1,

    // Strict Mode (http://eslint.org/docs/rules/#strict-mode)
    strict: 0,

    // Variables (http://eslint.org/docs/rules/#variables)
    'init-declarations': 0,
    'no-catch-shadow': 1,
    'no-delete-var': 1,
    'no-label-var': 1,
    'no-restricted-globals': 0,
    'no-shadow-restricted-names': 1,
    'no-shadow': 1,
    'no-undef-init': 0,
    'no-undef': 1,
    'no-undefined': 0,
    'no-unused-vars': [1, { args: 'none' }],
    'no-use-before-define': 0,

    // Node.js and CommonJS (http://eslint.org/docs/rules/#nodejs-and-commonjs)
    'callback-return': 0,
    'global-require': 0,
    'handle-callback-err': 1,
    'no-mixed-requires': 1,
    'no-new-require': 1,
    'no-path-concat': 1,
    'no-process-env': 0,
    'no-process-exit': 0,
    'no-restricted-modules': 0,
    'no-sync': 0,

    // Stylistic Issues (http://eslint.org/docs/rules/#stylistic-issues)
    camelcase: 0,
    'capitalized-comments': 0,
    'consistent-this': 0,
    'func-name-matching': 0,
    'func-names': 0,
    'func-style': 0,
    'id-blacklist': 0,
    'id-length': 0,
    'id-match': 0,
    indent: 0,
    'line-comment-position': 0,
    'linebreak-style': 0, // prettier --list-different
    'lines-around-comment': 0,
    'lines-around-directive': 0,
    'max-depth': 0,
    'max-lines': 0,
    'max-nested-callbacks': 0,
    'max-params': 0,
    'max-statements-per-line': 0,
    'max-statements': 0,
    'multiline-ternary': 0,
    'new-cap': 0,
    'newline-after-var': 0,
    'newline-before-return': 0,
    'newline-per-chained-call': 0,
    'no-array-constructor': 1,
    'no-bitwise': 1,
    'no-continue': 0,
    'no-inline-comments': 0,
    'no-lonely-if': 0,
    'no-mixed-operators': 0,
    'no-negated-condition': 0,
    'no-nested-ternary': 0,
    'no-new-object': 1,
    'no-plusplus': 0,
    'no-restricted-syntax': 0,
    'no-ternary': 0,
    'no-underscore-dangle': 0,
    'no-unneeded-ternary': 0,
    'object-curly-newline': 0,
    'object-property-newline': 0,
    'one-var-declaration-per-line': 0,
    'one-var': [1, 'never'],
    'operator-assignment': 1,
    'operator-linebreak': 0,
    'require-jsdoc': 0,
    'sort-keys': 0,
    'sort-vars': 0,
    'spaced-comment': [
      1,
      'always',
      { line: { exceptions: ['-'] }, block: { balanced: true } },
    ],
    'wrap-regex': 0,

    // ECMAScript 6 (http://eslint.org/docs/rules/#ecmascript-6)
    'arrow-body-style': 0,
    'constructor-super': 1,
    'no-class-assign': 1,
    'no-const-assign': 1,
    'no-dupe-class-members': 1,
    'no-duplicate-imports': 0,
    'no-new-symbol': 1,
    'no-restricted-imports': 0,
    'no-this-before-super': 1,
    'no-useless-computed-key': 1,
    'no-useless-constructor': 0,
    'no-useless-rename': 1,
    'no-var': 1,
    'object-shorthand': 1,
    'prefer-arrow-callback': [0, { allowNamedFunctions: true }], // prettier --list-different
    'prefer-const': 1,
    'prefer-numeric-literals': 0,
    'prefer-rest-params': 0,
    'prefer-spread': 1,
    'prefer-template': 0,
    'require-yield': 0,
    'sort-imports': 0,
    'symbol-description': 1,

    // Babel (https://github.com/babel/eslint-plugin-babel)
    'babel/new-cap': 0,
    'babel/no-invalid-this': 0,
    'babel/object-curly-spacing': 0,

    // import (https://github.com/benmosher/eslint-plugin-import)
    // 'import/no-unresolved': [2, { modules: 'es6' }],
    'import/no-cycle': 0,
    'import/no-extraneous-dependencies': 1,

    // prefer-object-spread (https://github.com/bryanrsmith/eslint-plugin-prefer-object-spread)
    'prefer-object-spread/prefer-object-spread': 1,

    // react rules
    'react/jsx-boolean-value': 'error',
    'react/jsx-handler-names': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-literals': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-deprecated': 'error',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-string-refs': 'error',
    'react/no-unknown-property': 'error',
    'react/prop-types': 0,
    'react/prefer-es6-class': 'error',
    'react/prefer-stateless-function': 'error',
    'react/react-in-jsx-scope': 'error',
    'react/self-closing-comp': 'error',
    'react/display-name': 'warn',
    // Jest rules
    'jest/no-conditional-expect': 0,
  },

  plugins: ['import', 'prefer-object-spread', '@typescript-eslint'],

  overrides: [
    // Cypress plugin, global, etc only for cypress directory
    // https://github.com/cypress-io/eslint-plugin-cypress
    // cypress clashes with jest expect()
    {
      files: ['**/cypress/**'],
      plugins: ['cypress'],
      env: {
        'cypress/globals': true,
      },
    },
    {
      excludedFiles: ['**/cypress/**/*.{js,ts}'],
      files: [
        '**/__{tests,mocks}__/*.{js,jsx,ts,tsx}',
        '**/*.spec.{ts,js.jsx.tsx}',
      ],
      extends: ['plugin:jest/recommended'],
      env: {
        'jest/globals': true,
      },
      rules: {
        'jest/no-conditional-expect': 0,
      },
    },
    // Rules for TypeScript only
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-unused-vars': 'off',
      },
    },
    {
      // Converted from 'dependencies' options in ancient config
      files: ['**/spec/**', '**/sample-*/**'],
      rules: {
        'import/no-cycle': 0,
      },
    },
    {
      // Resources are typically our helper scripts; make life easier there
      files: ['resources/*.js', '**/resources/*.js'],
      rules: {
        'no-console': 0,
        'no-await-in-loop': 0,
      },
    },
  ],
};
