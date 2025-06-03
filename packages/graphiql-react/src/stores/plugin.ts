import { ComponentType, FC, ReactElement, ReactNode, useEffect } from 'react';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';

export type GraphiQLPlugin = {
  /**
   * A component that renders content into the plugin pane.
   */
  content: ComponentType;
  /**
   * A component that renders an icon that will be shown inside a button that
   * toggles the plugin visibility.
   */
  icon: ComponentType;
  /**
   * The unique title of the plugin. If two plugins are present with the same
   * title the provider component will throw an error.
   */
  title: string;
};

type PluginStoreType = {
  /**
   * A list of all current plugins, including the built-in ones (the doc
   * explorer and the history).
   */
  plugins: GraphiQLPlugin[];
  /**
   * Defines the plugin which is currently visible.
   * @param plugin The plugin that should become visible. You can either pass
   * the plugin object (has to be referentially equal to the one passed as
   * prop) or the plugin title as string. If `null` is passed, no plugin will
   * be visible.
   */
  setVisiblePlugin(plugin: GraphiQLPlugin | string | null): void;
  /**
   * The plugin which is currently visible.
   */
  visiblePlugin: GraphiQLPlugin | null;
  /**
   * The plugin which is used to display the reference documentation when selecting a type.
   */
  referencePlugin?: GraphiQLPlugin;
  /**
   * Invoked when the visibility state of any plugin changes.
   * @param visiblePlugin The plugin object that is now visible. If no plugin
   * is visible, the function will be invoked with `null`.
   */
  onTogglePluginVisibility?(visiblePlugin: GraphiQLPlugin | null): void;

  setPlugins(plugins: GraphiQLPlugin[]): void;
};

type PluginStoreProps = Pick<
  PluginStoreType,
  'referencePlugin' | 'onTogglePluginVisibility'
> & {
  children: ReactNode;
  /**
   * This prop accepts a list of plugins that will be shown in addition to the
   * built-in ones (the doc explorer and the history).
   */
  plugins?: GraphiQLPlugin[];
  /**
   * This prop can be used to set the visibility state of plugins. Every time
   * this prop changes, the visibility state will be overridden. Note that the
   * visibility state can change in between these updates, for example, by
   * calling the `setVisiblePlugin` function provided by the context.
   */
  visiblePlugin?: GraphiQLPlugin | string;
};

export const pluginStore = createStore<PluginStoreType>((set, get) => ({
  plugins: [],
  visiblePlugin: null,
  referencePlugin: undefined,
  setVisiblePlugin(plugin) {
    const { plugins, onTogglePluginVisibility } = get();
    const byTitle = typeof plugin === 'string';
    const newVisiblePlugin: PluginStoreType['visiblePlugin'] =
      (plugin && plugins.find(p => (byTitle ? p.title : p) === plugin)) || null;
    set(({ visiblePlugin }) => {
      if (newVisiblePlugin === visiblePlugin) {
        return { visiblePlugin };
      }
      onTogglePluginVisibility?.(newVisiblePlugin);
      return { visiblePlugin: newVisiblePlugin };
    });
  },
  setPlugins(plugins) {
    const seenTitles = new Set<string>();
    const msg = 'All GraphiQL plugins must have a unique title';
    for (const { title } of plugins) {
      if (typeof title !== 'string' || !title) {
        throw new Error(msg);
      }
      if (seenTitles.has(title)) {
        throw new Error(`${msg}, found two plugins with the title '${title}'`);
      }
      seenTitles.add(title);
    }
    set({ plugins });
  },
}));

export const PluginStore: FC<PluginStoreProps> = ({
  onTogglePluginVisibility,
  children,
  visiblePlugin,
  plugins = [],
  referencePlugin,
}) => {
  useEffect(() => {
    // TODO: visiblePlugin initial data
    // const storedValue = storage.get(STORAGE_KEY);
    // const pluginForStoredValue = plugins.find(
    //   plugin => plugin.title === storedValue,
    // );
    // if (pluginForStoredValue) {
    //   return pluginForStoredValue;
    // }
    // if (storedValue) {
    //   storage.set(STORAGE_KEY, '');
    // }
    const { setPlugins, setVisiblePlugin } = pluginStore.getState();

    setPlugins(plugins);
    setVisiblePlugin(visiblePlugin ?? null);
    pluginStore.setState({
      onTogglePluginVisibility,
      referencePlugin,
    });
  }, [plugins, onTogglePluginVisibility, referencePlugin, visiblePlugin]);

  return children as ReactElement;
};

export const usePluginStore = createBoundedUseStore(pluginStore);

// const STORAGE_KEY = 'visiblePlugin';
