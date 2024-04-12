module.exports = {
  root: true,
  settings: {
    'import/core-modules': ['electron'],
    react: {
      version: 'detect',
    },
  },

  extends: ['airbnb-base', 'prettier', 'plugin:@typescript-eslint/recommended'],

  plugins: ['mocha', 'more', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['tsconfig.json'] },

  rules: {
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],

    // Enforce curlies always
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs'],

    // prevents us from accidentally checking in exclusive tests (`.only`):
    'mocha/no-exclusive-tests': 'error',

    // encourage consistent use of `async` / `await` instead of `then`
    'more/no-then': 'error',

    // it helps readability to put public API at top,
    'no-use-before-define': 'off',

    // useful for unused or internal fields
    'no-underscore-dangle': 'off',

    'no-console': 'off',

    // consistently place operators at end of line except ternaries
    'operator-linebreak': 'error',

    // Use LF to stay consistent
    'linebreak-style': ['error', 'unix'],

    'import/no-extraneous-dependencies': 'off',
    'no-await-in-loop': 'off',
    'import/order': 'off',

    quotes: [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    '@typescript-eslint/no-floating-promises': ['error'],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/no-misused-promises': 'error',

    // Prettier overrides:
    'arrow-parens': 'off',
    'no-nested-ternary': 'off',
    'function-paren-newline': 'off',

    'import/prefer-default-export': 'off',
    'operator-linebreak': 'off',
    'prefer-destructuring': 'off',
    'max-classes-per-file': 'off',
    'lines-between-class-members': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // to reenable later
    'arrow-body-style': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-void': 'off',
    'default-param-last': 'off',

    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'class-methods-use-this': 'off',
    camelcase: 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 'no-unused-expressions': 'off',
    // '@typescript-eslint/no-unused-expressions': 'error',

    'max-len': [
      'error',
      {
        // Prettier generally limits line length to 80 but sometimes goes over.
        // The `max-len` plugin doesn’t let us omit `code` so we set it to a
        // high value as a buffer to let Prettier control the line length:
        code: 999,
        // We still want to limit comments as before:
        comments: 200,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
      },
    ],
  },
  overrides: [],
};
