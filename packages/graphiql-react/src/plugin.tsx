import { ComponentType, FC, ReactNode, useEffect, useState } from 'react';
import { useStorage } from './storage';
import { createContextHook, createNullableContext } from './utility';

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

export type PluginContextType = {
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
};

export const PluginContext =
  createNullableContext<PluginContextType>('PluginContext');

type PluginContextProviderProps = Pick<PluginContextType, 'referencePlugin'> & {
  children: ReactNode;
  /**
   * Invoked when the visibility state of any plugin changes.
   * @param visiblePlugin The plugin object that is now visible. If no plugin
   * is visible, the function will be invoked with `null`.
   */
  onTogglePluginVisibility?(visiblePlugin: GraphiQLPlugin | null): void;
  /**
   * This props accepts a list of plugins that will be shown in addition to the
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

export const PluginContextProvider: FC<PluginContextProviderProps> = ({
  onTogglePluginVisibility,
  children,
  visiblePlugin,
  plugins: $plugins,
  referencePlugin,
}) => {
  const storage = useStorage();
  const plugins = (() => {
    const pluginList: GraphiQLPlugin[] = [];
    const pluginTitles: Record<string, true> = {};
    for (const plugin of $plugins || []) {
      if (typeof plugin.title !== 'string' || !plugin.title) {
        throw new Error('All GraphiQL plugins must have a unique title');
      }
      if (pluginTitles[plugin.title]) {
        throw new Error(
          `All GraphiQL plugins must have a unique title, found two plugins with the title '${plugin.title}'`,
        );
      } else {
        pluginList.push(plugin);
        pluginTitles[plugin.title] = true;
      }
    }

    return pluginList;
  })();

  const [$visiblePlugin, internalSetVisiblePlugin] =
    useState<GraphiQLPlugin | null>(() => {
      const storedValue = storage?.get(STORAGE_KEY);
      const pluginForStoredValue = plugins.find(
        plugin => plugin.title === storedValue,
      );
      if (pluginForStoredValue) {
        return pluginForStoredValue;
      }
      if (storedValue) {
        storage?.set(STORAGE_KEY, '');
      }

      if (!visiblePlugin) {
        return null;
      }

      return (
        plugins.find(
          plugin =>
            (typeof visiblePlugin === 'string' ? plugin.title : plugin) ===
            visiblePlugin,
        ) || null
      );
    });

  const setVisiblePlugin: PluginContextType['setVisiblePlugin'] = // eslint-disable-line react-hooks/exhaustive-deps -- false positive, function is optimized by react-compiler, no need to wrap with useCallback
    plugin => {
      const newVisiblePlugin = plugin
        ? plugins.find(
            p => (typeof plugin === 'string' ? p.title : p) === plugin,
          ) || null
        : null;
      internalSetVisiblePlugin(current => {
        if (newVisiblePlugin === current) {
          return current;
        }
        onTogglePluginVisibility?.(newVisiblePlugin);
        return newVisiblePlugin;
      });
    };

  useEffect(() => {
    if (visiblePlugin) {
      setVisiblePlugin(visiblePlugin);
    }
  }, [plugins, visiblePlugin, setVisiblePlugin]);

  const value: PluginContextType = {
    plugins,
    setVisiblePlugin,
    visiblePlugin: $visiblePlugin,
    referencePlugin,
  };
  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
};

export const usePluginContext = createContextHook(PluginContext);

const STORAGE_KEY = 'visiblePlugin';
