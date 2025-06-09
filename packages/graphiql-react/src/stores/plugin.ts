import { ComponentType } from 'react';
import type { StateCreator } from 'zustand';
import type { AllSlices } from '../types';

export interface GraphiQLPlugin {
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
}

export interface PluginSlice {
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
   * Pass `null` to remove plugin.
   */
  referencePlugin?: GraphiQLPlugin | null;

  /**
   * Invoked when the visibility state of any plugin changes.
   * @param visiblePlugin The plugin object that is now visible. If no plugin
   * is visible, the function will be invoked with `null`.
   */
  onTogglePluginVisibility?(visiblePlugin: GraphiQLPlugin | null): void;

  setPlugins(plugins: GraphiQLPlugin[]): void;
}

export interface PluginProps
  extends Pick<PluginSlice, 'referencePlugin' | 'onTogglePluginVisibility'> {
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
}

type CreatePluginSlice = StateCreator<AllSlices, [], [], PluginSlice>;

export const createPluginSlice: CreatePluginSlice = (set, get) => ({
  plugins: [],
  visiblePlugin: null,
  referencePlugin: undefined,
  setVisiblePlugin(plugin) {
    const { plugins, onTogglePluginVisibility } = get();
    const byTitle = typeof plugin === 'string';
    const newVisiblePlugin: PluginSlice['visiblePlugin'] =
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
});
