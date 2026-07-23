import type { StorybookConfig } from 'storybook-react-rsbuild';

const config: StorybookConfig = {
  stories: [
    '../../client/src/**/*.mdx',
    '../../client/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'storybook/viewport'],
  framework: {
    name: 'storybook-react-rsbuild',
    options: {
      builder: {
        rsbuildConfigPath: '../client/rsbuild.config.ts',
        environment: 'web',
      },
    },
  },
};
export default config;
