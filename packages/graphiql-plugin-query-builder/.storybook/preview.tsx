import { useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';
import '@graphiql/react/style.css';

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
  },
  decorators: [
    (Story, ctx) => {
      useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', ctx.globals.theme);
        document.body.style.background = 'oklch(var(--bg-canvas))';
        document.body.style.color = 'oklch(var(--fg-default))';
        document.body.style.margin = '0';
      }, [ctx.globals.theme]);

      return (
        <div
          className="graphiql-container"
          style={{
            padding: 24,
            background: 'oklch(var(--bg-canvas))',
            color: 'oklch(var(--fg-default))',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
