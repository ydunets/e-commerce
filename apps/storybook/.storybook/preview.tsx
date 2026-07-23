import type { Preview } from 'storybook-react-rsbuild'

import '../../client/src/app.css'

// Named after this app's Tailwind breakpoints (base/md-768/lg-1024), not raw
// device presets, so a story can genuinely land in a specific CSS tier.
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '900px' }, type: 'desktop' },
      },
    },
  },
};

export default preview;