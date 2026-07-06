import { PLUGIN_REACT_NAME, pluginReact } from '@rsbuild/plugin-react';
import { withRsbuildConfig } from '@rstest/adapter-rsbuild';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  extends: withRsbuildConfig({
    modifyRsbuildConfig: (config) => ({
      ...config,
      plugins: [
        // rstest bundles an older Rspack whose swc-loader rejects the
        // `reactCompiler` option, so run tests with the compiler disabled.
        ...(config.plugins ?? []).filter(
          (plugin) =>
            !(
              typeof plugin === 'object' &&
              plugin !== null &&
              'name' in plugin &&
              plugin.name === PLUGIN_REACT_NAME
            ),
        ),
        pluginReact(),
      ],
    }),
  }),
  setupFiles: ['./tests/rstest.setup.ts'],
});
