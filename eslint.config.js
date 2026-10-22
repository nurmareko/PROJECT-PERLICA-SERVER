import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  test: true,
  ignores: [
    'src/generated/**',
    'src/config/push-notification-key.json',
  ],
}, {
  files: ['test/**/*.test.js'],
  languageOptions: {
    globals: {
      describe: 'readonly',
      expect: 'readonly',
      it: 'readonly',
    },
  },
})
