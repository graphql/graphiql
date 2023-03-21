import {
  ComponentType,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DocExplorer, useExplorerContext } from './explorer';
import { History, useHistoryContext } from './history';
import { DocsFilledIcon, DocsIcon, HistoryIcon } from './icons';
import { useStorageContext } from './storage';
import { createContextHook, createNullableContext } from './utility/context';

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

export const DOC_EXPLORER_PLUGIN: GraphiQLPlugin = {
  title: 'Documentation Explorer',
  icon: function Icon() {
    const pluginContext = usePluginContext();
    return pluginContext?.visiblePlugin === DOC_EXPLORER_PLUGIN ? (
      <DocsFilledIcon />
    ) : (
      <DocsIcon />
    );
  },
  content: DocExplorer,
};
export const HISTORY_PLUGIN: GraphiQLPlugin = {
  title: 'History',
  icon: HistoryIcon,
  content: History,
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
};

export const PluginContext =
  createNullableContext<PluginContextType>('PluginContext');

export type PluginContextProviderProps = {
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
   * visibility state can change in between these updates, for example by
   * calling the `setVisiblePlugin` function provided by the context.
   */
  visiblePlugin?: GraphiQLPlugin | string;
};

export function PluginContextProvider(props: PluginContextProviderProps) {
  const storage = useStorageContext();
  const explorerContext = useExplorerContext();
  const historyContext = useHistoryContext();

  const hasExplorerContext = Boolean(explorerContext);
  const hasHistoryContext = Boolean(historyContext);
  const plugins = useMemo(() => {
    const pluginList: GraphiQLPlugin[] = [];
    const pluginTitles: Record<string, true> = {};

    if (hasExplorerContext) {
      pluginList.push(DOC_EXPLORER_PLUGIN);
      pluginTitles[DOC_EXPLORER_PLUGIN.title] = true;
    }
    if (hasHistoryContext) {
      pluginList.push(HISTORY_PLUGIN);
      pluginTitles[HISTORY_PLUGIN.title] = true;
    }

    for (const plugin of props.plugins || []) {
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
  }, [hasExplorerContext, hasHistoryContext, props.plugins]);

  const [visiblePlugin, internalSetVisiblePlugin] =
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

      if (!props.visiblePlugin) {
        return null;
      }

      return (
        plugins.find(
          plugin =>
            (typeof props.visiblePlugin === 'string'
              ? plugin.title
              : plugin) === props.visiblePlugin,
        ) || null
      );
    });

  const { onTogglePluginVisibility, children } = props;
  const setVisiblePlugin = useCallback<PluginContextType['setVisiblePlugin']>(
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
    },
    [onTogglePluginVisibility, plugins],
  );

  useEffect(() => {
    if (props.visiblePlugin) {
      setVisiblePlugin(props.visiblePlugin);
    }
  }, [plugins, props.visiblePlugin, setVisiblePlugin]);

  const value = useMemo<PluginContextType>(
    () => ({ plugins, setVisiblePlugin, visiblePlugin }),
    [plugins, setVisiblePlugin, visiblePlugin],
  );

  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
}

export const usePluginContext = createContextHook(PluginContext);

const STORAGE_KEY = 'visiblePlugin';
