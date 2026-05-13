import type { Preview } from '@storybook/react-vite';
import '../src/style/root.css';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
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
    (Story, ctx) => (
      <div
        className="graphiql-container"
        data-theme={ctx.globals.theme}
        data-density={ctx.globals.density}
        data-font-size={ctx.globals.fontSize}
        style={{ padding: 24 }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
