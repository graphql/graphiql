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
  reportUnusedDisableDirectives: true,
  parserOptions: {
    ecmaVersion: 6,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  // https://github.com/sindresorhus/globals/blob/master/globals.json
  env: {
    atomtest: true,
    es6: true,
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
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
    'no-console': 'error',
    'no-constant-binary-expression': 2,
    'no-empty': [1, { allowEmptyCatch: true }],
    'no-extra-parens': 0,
    'no-template-curly-in-string': 0,
    'valid-jsdoc': 0,

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
    'no-alert': 'error',
    'no-await-in-loop': 1,
    'no-caller': 1,
    'no-case-declarations': 0,
    'no-div-regex': 1,
    'no-else-return': ['error', { allowElseIf: false }],
    'no-eq-null': 0,
    'no-eval': 1,
    'no-extend-native': 1,
    'no-extra-bind': 1,
    'no-extra-label': 1,
    'no-floating-decimal': 0, // prettier --list-different
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
    'no-new': 'error',
    'no-octal-escape': 1,
    'no-param-reassign': 1,
    'no-proto': 1,
    'no-restricted-properties': 0,
    'no-return-assign': 1,
    'no-return-await': 1,
    'no-script-url': 1,
    'no-self-compare': 1,
    'no-sequences': 1,
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 0,
    'no-useless-call': 1,
    'no-useless-concat': 1,
    'no-useless-return': 0,
    '@typescript-eslint/prefer-optional-chain': 'error',
    'no-warning-comments': 0,
    radix: 'error',
    'require-await': 0,
    'vars-on-top': 0,
    yoda: 1,
    'unicorn/prefer-string-slice': 'error',
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/no-extra-arguments': 'error',
    'unicorn/no-useless-undefined': 'error',
    'no-var': 'error',
    // Strict Mode (http://eslint.org/docs/rules/#strict-mode)
    strict: 0,

    // Variables (http://eslint.org/docs/rules/#variables)
    'init-declarations': 0,
    'no-catch-shadow': 1,
    'no-label-var': 1,
    'no-restricted-globals': 0,
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-undef-init': 0,
    'no-undefined': 0,

    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^React$',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    'no-use-before-define': 0,

    'unicorn/no-useless-switch-case': 'error',
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
    'no-bitwise': 1,
    'no-continue': 0,
    'no-inline-comments': 0,
    'no-mixed-operators': 0,
    'no-negated-condition': 'off',
    'unicorn/no-negated-condition': 'error',
    'no-nested-ternary': 0,
    'no-new-object': 1,
    'no-plusplus': 0,
    'no-restricted-syntax': [
      'error',
      {
        // ❌ useMemo(…, [])
        selector:
          'CallExpression[callee.name=useMemo][arguments.1.type=ArrayExpression][arguments.1.elements.length=0]',
        message:
          "`useMemo` with an empty dependency array can't provide a stable reference, use `useRef` instead.",
      },
    ],
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
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    'wrap-regex': 0,
    'unicorn/prefer-dom-node-remove': 'error',
    // ECMAScript 6 (http://eslint.org/docs/rules/#ecmascript-6)
    'arrow-body-style': 0,
    'no-duplicate-imports': 0,
    'no-restricted-imports': 0,
    'no-useless-computed-key': 1,
    'no-useless-constructor': 0,
    'no-useless-rename': 1,
    'object-shorthand': 1,
    'prefer-arrow-callback': [0, { allowNamedFunctions: true }], // prettier --list-different
    'prefer-numeric-literals': 0,
    'prefer-template': 0,
    'sort-imports': 0,
    'symbol-description': 1,

    'sonarjs/no-ignored-return': 'error',
    'unicorn/no-array-push-push': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 'error',
    'prefer-object-spread': 'error',
    // React rules
    'react/no-unused-state': 'error',
    'react/jsx-curly-brace-presence': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-handler-names': 'error',
    'react/jsx-pascal-case': 'error',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/prop-types': 0,
    'react/prefer-es6-class': 'error',
    'react/prefer-stateless-function': 'error',
    'react/self-closing-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.tsx', '.jsx'], allow: 'as-needed' },
    ],

    'unicorn/no-typeof-undefined': 'error',
    'unicorn/prefer-at': 'error',
    'unicorn/consistent-destructuring': 'error',
    'prefer-destructuring': ['error', { VariableDeclarator: { object: true } }],
    'promise/no-multiple-resolved': 'error',
    'unicorn/no-zero-fractions': 'error',
    'sonarjs/no-redundant-jump': 'error',
    'unicorn/prefer-logical-operator-over-ternary': 'error',
    'logical-assignment-operators': [
      'error',
      'always',
      { enforceForIfStatements: true },
    ],
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-export-from': ['error', { ignoreUsedVariables: true }],
    'unicorn/throw-new-error': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/no-array-for-each': 'error',
    'unicorn/prefer-dom-node-append': 'error',
    'no-lonely-if': 'error',
    'unicorn/no-lonely-if': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': 'error',
    'sonarjs/no-small-switch': 'error',
    'sonarjs/no-duplicated-branches': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'import/no-unresolved': ['error', { ignore: ['^node:'] }],
    'unicorn/prefer-string-replace-all': 'error',

    'unicorn/prefer-switch': 'error',
    // TODO: Fix all errors for the following rules included in recommended config
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-namespace': 'off',
  },

  plugins: ['promise', 'sonarjs', 'unicorn'],

  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      // extends: ['plugin:@typescript-eslint/recommended-type-checked'],
      rules: {
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
      },
      parserOptions: {
        project: [
          'packages/*/tsconfig.json',
          'examples/*/tsconfig.json',
          'packages/graphiql/cypress/tsconfig.json',
          'tsconfig.eslint.json',
        ],
      },
    },
    // Cypress plugin, global, etc., only for cypress directory
    // https://github.com/cypress-io/eslint-plugin-cypress
    // cypress clashes with jest expect()
    {
      files: ['**/cypress/**'],
      extends: 'plugin:cypress/recommended',
    },
    {
      files: [
        '**/__{tests,mocks}__/*.{js,jsx,ts,tsx}',
        '**/*.spec.{ts,js.jsx.tsx}',
      ],
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/no-conditional-expect': 'off',
        'jest/expect-expect': ['error', { assertFunctionNames: ['expect*'] }],
      },
    },
    {
      // Resources are typically our helper scripts; make life easier there
      files: ['resources/**', '**/resources/**', 'scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Disable rules for examples folder
      files: ['examples/**'],
      rules: {
        'no-console': 'off',
        'no-new': 'off',
        'no-alert': 'off',
        'import/no-unresolved': 'off',
      },
    },
    // Ignore imported dependencies from tests files
    {
      files: ['**/__tests__/**', 'webpack.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    // Allow import `vscode` package
    {
      files: [
        'packages/vscode-graphql/**',
        'packages/vscode-graphql-execution/**',
      ],
      rules: {
        'import/no-unresolved': ['error', { ignore: ['^node:', 'vscode'] }],
      },
    },
  ],
};
