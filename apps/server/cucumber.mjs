// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
const config = {
  import: ['dist/tests/support/**/*.js', 'dist/tests/**/*.steps.js'],
  paths: ['tests/**/*.feature'],
  format: [
    'json:reports/cucumber-report.json',
    'html:reports/index.html',
    'summary',
    'progress-bar',
    '@cucumber/pretty-formatter',
  ],
  formatOptions: { snippetInterface: 'async-await' },
};

export default config;
