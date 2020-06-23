import { theme } from '../components/common/themes/default'

export type SidebarTabDefiniton = {
  id: string
  label: string
  component: Promise<React.FC>
  icon: SVGElement
}

export type RegionTabDefinition = {
  id: string
  component: Promise<React.FC>
  label: string
  region: Regions
}

enum Regions {
  'operation',
  'variables',
  'results'
}

enum OptionTypes {
  'string',
  'boolean',
  'number',
}

export type PluginOption = {
  default: any,
  type: OptionTypes
}

export type EventHooks = {
  onEditOperation: () => void
}

export type Locales = {
  [locale: string]: {
    [localeKey: string]: string
  }
}

export type ThemeOverride = ({ Layout, theme }) => { Layout: React.FC, theme: typeof theme };

export interface PluginDefinition {
  name: string
  description?: string
  additionalProviders?: React.FC[]
  sidebarTabs?: SidebarTabDefiniton[]
  regionTabs?: RegionTabDefinition[]
  pluginOptions?: { [key: string]: PluginOption }
  eventHooks?: EventHooks
  localeStrings?: Locales
  themeOverride?: ThemeOverride
}
