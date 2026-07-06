import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [
    pluginReact({
      reactCompiler: true,
    }),
    pluginTailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, 'src'),
    },
  },
  server: {
    // Port 3000 is often taken by Docker on this machine.
    port: 5173,
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
          // Absolute paths so the config also works when loaded from the
          // storybook package (different cwd).
          routesDirectory: path.join(import.meta.dirname, 'src/routes'),
          generatedRouteTree: path.join(
            import.meta.dirname,
            'src/routeTree.gen.ts',
          ),
        }),
      ],
    },
  },
  environments: {
    // Client bundle: hydrates the server-rendered HTML.
    web: {
      source: {
        entry: { index: './src/entry-client.tsx' },
      },
      output: {
        target: 'web',
        manifest: true,
      },
    },
    // Server bundle: renders HTML per request.
    node: {
      source: {
        entry: { index: './src/entry-server.tsx' },
      },
      output: {
        target: 'node',
        distPath: { root: 'dist/server' },
      },
    },
  },
});
