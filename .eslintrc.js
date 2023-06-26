/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

const RESTRICTED_IMPORTS = [
  { name: 'graphql/type', message: 'use `graphql`' },
  { name: 'graphql/language', message: 'use `graphql`' },
  { name: 'graphql/type/introspection', message: 'use `graphql`' },
  { name: 'graphql/type/definition', message: 'use `graphql`' },
  { name: 'graphql/type/directives', message: 'use `graphql`' },
  { name: 'graphql/version', message: 'use `graphql`' },
  {
    name: 'monaco-editor',
    message:
      '`monaco-editor` import all languages; use `monaco-graphql/esm/monaco-editor` instead to import only `json` and `graphql` languages',
  },
];

module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  ignorePatterns: ['react-app-env.d.ts', 'next-env.d.ts'],
  overrides: [
    {
      // Rules for all code files
      files: ['**/*.{js,jsx,ts,tsx}'],
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
      plugins: [
        'promise',
        'sonarjs',
        'unicorn',
        '@arthurgeron/react-usememo',
        'sonar',
        '@shopify',
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
        '@shopify/prefer-early-return': ['error', { maximumStatements: 2 }],
        '@shopify/prefer-class-properties': 'off', // enable after https://github.com/Shopify/web-configs/issues/387 will be fixed
        'sonarjs/no-inverted-boolean-check': 'error',
        '@arthurgeron/react-usememo/require-usememo': [
          'error',
          { checkHookCalls: false },
        ],
        // Possible Errors (http://eslint.org/docs/rules/#possible-errors)
        'no-console': 'error',
        'no-constant-binary-expression': 'error',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-extra-parens': 'off',
        'no-template-curly-in-string': 'off',
        'valid-jsdoc': 'off',

        // Best Practices (http://eslint.org/docs/rules/#best-practices)
        'accessor-pairs': 'error',
        'array-callback-return': 'off',
        'block-scoped-var': 'off',
        'class-methods-use-this': 'off',
        complexity: 'off',
        'consistent-return': 'off',
        curly: 'error',
        'default-case': 'off',
        'dot-notation': 'error',
        eqeqeq: ['error', 'allow-null'],
        'guard-for-in': 'off',
        'no-alert': 'error',
        'no-await-in-loop': 'error',
        'no-caller': 'error',
        'no-case-declarations': 'off',
        'no-div-regex': 'error',
        'no-else-return': ['error', { allowElseIf: false }],
        'no-eq-null': 'off',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-floating-decimal': 'off', // prettier --list-different
        'no-implicit-coercion': 'error',
        'no-implicit-globals': 'off',
        'no-implied-eval': 'error',
        'no-invalid-this': 'off',
        'no-iterator': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-loop-func': 'off',
        'no-magic-numbers': 'off',
        'no-multi-str': 'off',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-new': 'error',
        'no-octal-escape': 'error',
        'no-param-reassign': 'error',
        'no-proto': 'error',
        'no-restricted-properties': 'off',
        'no-return-assign': 'error',
        'no-return-await': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'off',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'off',
        '@typescript-eslint/prefer-optional-chain': 'error',
        'no-warning-comments': 'off',
        radix: 'error',
        'require-await': 'off',
        'vars-on-top': 'off',
        yoda: 'error',
        'unicorn/prefer-string-slice': 'error',
        'sonarjs/no-identical-functions': 'error',
        'sonarjs/no-unused-collection': 'error',
        'sonarjs/no-extra-arguments': 'error',
        'unicorn/no-useless-undefined': 'error',
        'no-var': 'error',
        // Strict Mode (http://eslint.org/docs/rules/#strict-mode)
        strict: 'off',

        // Variables (http://eslint.org/docs/rules/#variables)
        'init-declarations': 'off',
        'no-catch-shadow': 'error',
        'no-label-var': 'error',
        'no-restricted-globals': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-undef-init': 'off',
        'no-undefined': 'off',

        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^React$',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],

        'no-use-before-define': 'off',

        'unicorn/no-useless-switch-case': 'error',
        // Node.js and CommonJS (http://eslint.org/docs/rules/#nodejs-and-commonjs)
        'callback-return': 'off',
        'global-require': 'off',
        'handle-callback-err': 'error',
        'no-mixed-requires': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',
        'no-process-env': 'off',
        'no-process-exit': 'off',
        'no-restricted-modules': 'off',
        'no-sync': 'off',

        // Stylistic Issues (http://eslint.org/docs/rules/#stylistic-issues)
        camelcase: 'off',
        'capitalized-comments': 'off',
        'consistent-this': 'off',
        'func-name-matching': 'off',
        'func-names': 'off',
        'func-style': 'off',
        'id-blacklist': 'off',
        'id-length': 'off',
        'id-match': 'off',
        indent: 'off',
        'line-comment-position': 'off',
        'linebreak-style': 'off', // prettier --list-different
        'lines-around-comment': 'off',
        'lines-around-directive': 'off',
        'max-depth': 'off',
        'max-lines': 'off',
        'max-nested-callbacks': 'off',
        'max-params': 'off',
        'max-statements-per-line': 'off',
        'max-statements': 'off',
        'multiline-ternary': 'off',
        'new-cap': 'off',
        'newline-after-var': 'off',
        'newline-before-return': 'off',
        'newline-per-chained-call': 'off',
        'no-bitwise': 'error',
        'no-continue': 'off',
        'no-inline-comments': 'off',
        'no-mixed-operators': 'off',
        'no-negated-condition': 'off',
        'unicorn/no-negated-condition': 'error',
        'no-nested-ternary': 'off',
        'no-new-object': 'error',
        'no-plusplus': 'off',
        'no-restricted-syntax': [
          'error',
          {
            // ❌ useMemo(…, [])
            selector:
              'CallExpression[callee.name=useMemo][arguments.1.type=ArrayExpression][arguments.1.elements.length=0]',
            message:
              "`useMemo` with an empty dependency array can't provide a stable reference, use `useRef` instead.",
          },
          {
            // ❌ event.keyCode
            selector:
              'MemberExpression > .property[type=Identifier][name=keyCode]',
            message: 'Use `.key` instead of `.keyCode`',
          },
        ],
        'no-ternary': 'off',
        'no-underscore-dangle': 'off',
        'no-unneeded-ternary': 'off',
        'object-curly-newline': 'off',
        'object-property-newline': 'off',
        'one-var-declaration-per-line': 'off',
        'one-var': ['error', 'never'],
        'operator-assignment': 'error',
        'operator-linebreak': 'off',
        'require-jsdoc': 'off',
        'sort-keys': 'off',
        'sort-vars': 'off',
        'spaced-comment': ['error', 'always', { markers: ['/'] }],
        'wrap-regex': 'off',
        'unicorn/prefer-dom-node-remove': 'error',
        // ECMAScript 6 (http://eslint.org/docs/rules/#ecmascript-6)
        'arrow-body-style': 'off',
        '@typescript-eslint/no-restricted-imports': [
          'error',
          ...RESTRICTED_IMPORTS,
        ],
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'off',
        'no-useless-rename': 'error',
        'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
        'object-shorthand': [
          'error',
          'always',
          { avoidExplicitReturnArrows: true },
        ],
        'prefer-numeric-literals': 'off',
        'prefer-template': 'off',
        'sort-imports': 'off',
        'symbol-description': 'error',

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
        'react/prop-types': 'off',
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
        'prefer-destructuring': [
          'error',
          { VariableDeclarator: { object: true } },
        ],
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
        'sonar/prefer-promise-shorthand': 'error',
        'sonar/no-dead-store': 'error',
        'unicorn/prefer-node-protocol': 'error',
        'import/no-unresolved': ['error', { ignore: ['^node:'] }],
        'unicorn/prefer-string-replace-all': 'error',
        // doesn't catch a lot of cases; we use ESLint builtin `no-restricted-syntax` to forbid `.keyCode`
        'unicorn/prefer-keyboard-event-key': 'off',

        'unicorn/prefer-switch': 'error',
        'unicorn/prefer-dom-node-text-content': 'error',
        quotes: ['error', 'single', { avoidEscape: true }], // Matches Prettier, but also replaces backticks with single quotes
        // TODO: Fix all errors for the following rules included in recommended config
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Rules that requires type information
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['**/*.{md,mdx}/*.{ts,tsx}'],
      // extends: ['plugin:@typescript-eslint/recommended-type-checked'],
      rules: {
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/non-nullable-type-assertion-style': 'error',
        '@typescript-eslint/consistent-type-assertions': 'error',
        // TODO: Fix all errors for the following rules included in recommended config
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        '@typescript-eslint/no-namespace': 'off',
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
      rules: {
        // Because innerText doesn't return hidden elements and returns new line (\n) characters
        'unicorn/prefer-dom-node-text-content': 'off',
      },
    },
    {
      // Rules for unit tests
      files: [
        '**/__{tests,mocks}__/*.{js,jsx,ts,tsx}',
        '**/*.spec.{ts,js.jsx.tsx}',
      ],
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/no-conditional-expect': 'off',
        'jest/expect-expect': ['error', { assertFunctionNames: ['expect*'] }],
        '@arthurgeron/react-usememo/require-usememo': 'off',
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
    {
      // Rule for ignoring imported dependencies from tests files
      files: ['**/__tests__/**', 'webpack.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      // Rule for allowing import `vscode` package
      files: [
        'packages/vscode-graphql/**',
        'packages/vscode-graphql-execution/**',
      ],
      rules: {
        'import/no-unresolved': ['error', { ignore: ['^node:', 'vscode'] }],
      },
    },
    {
      // Rule prefer await to then without React packages because it's ugly to have `async IIFE` inside `useEffect`
      files: ['packages/**'],
      excludedFiles: ['packages/graphiql/**', 'packages/graphiql-react/**'],
      rules: {
        'promise/prefer-await-to-then': 'error',
      },
    },
    {
      // Monaco-GraphQL rules
      files: ['packages/monaco-graphql/**'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          ...RESTRICTED_IMPORTS.filter(({ name }) => name !== 'monaco-editor'),
          {
            name: 'monaco-editor',
            message:
              '`monaco-editor` imports all languages; use locale `monaco-editor.ts` instead to import only `json` and `graphql` languages',
          },
        ],
      },
    },
    {
      // Parsing Markdown/MDX
      files: ['**/*.{md,mdx}'],
      parser: 'eslint-mdx',
      plugins: ['mdx'],
      processor: 'mdx/remark',
      settings: {
        'mdx/code-blocks': true,
      },
    },
    {
      // ❗ALWAYS LAST
      // Rules for codeblocks inside Markdown/MDX
      files: ['**/*.{md,mdx}/*.{js,jsx,ts,tsx}'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'import/no-unresolved': 'off',
        'no-console': 'off',
        'no-undef': 'off',
        'react/jsx-no-undef': 'off',
        'react-hooks/rules-of-hooks': 'off',
        '@arthurgeron/react-usememo/require-usememo': 'off',
        'sonar/no-dead-store': 'off',
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
};
