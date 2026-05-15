import { useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';
import '../src/style/root.css';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    a11y: { test: 'error' },
  },
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'expand',
        items: [
          { value: 'compact', title: 'Compact' },
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'spacious', title: 'Spacious' },
        ],
        dynamicTitle: true,
      },
    },
    fontSize: {
      description: 'Font size',
      defaultValue: 'default',
      toolbar: {
        icon: 'beaker',
        items: [
          { value: 'compact', title: 'Compact' },
          { value: 'default', title: 'Default' },
          { value: 'large', title: 'Large' },
          { value: 'xl', title: 'Extra large' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', ctx.globals.theme);
        root.setAttribute('data-density', ctx.globals.density);
        root.setAttribute('data-font-size', ctx.globals.fontSize);
      }, [ctx.globals.theme, ctx.globals.density, ctx.globals.fontSize]);

      return (
        <div className="graphiql-container" style={{ padding: 24 }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
