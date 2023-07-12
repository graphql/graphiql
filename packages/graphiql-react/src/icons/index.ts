import { ComponentProps, FC } from 'react';

import _ArgumentIcon from './argument.svg';
import _ChevronDownIcon from './chevron-down.svg';
import _ChevronLeftIcon from './chevron-left.svg';
import _ChevronUpIcon from './chevron-up.svg';
import _CloseIcon from './close.svg';
import _CopyIcon from './copy.svg';
import _DeprecatedArgumentIcon from './deprecated-argument.svg';
import _DeprecatedEnumValueIcon from './deprecated-enum-value.svg';
import _DeprecatedFieldIcon from './deprecated-field.svg';
import _DirectiveIcon from './directive.svg';
import _DocsFilledIcon from './docs-filled.svg';
import _DocsIcon from './docs.svg';
import _EnumValueIcon from './enum-value.svg';
import _FieldIcon from './field.svg';
import _HistoryIcon from './history.svg';
import _ImplementsIcon from './implements.svg';
import _KeyboardShortcutIcon from './keyboard-shortcut.svg';
import _MagnifyingGlassIcon from './magnifying-glass.svg';
import _MergeIcon from './merge.svg';
import _PenIcon from './pen.svg';
import _PlayIcon from './play.svg';
import _PlusIcon from './plus.svg';
import _PrettifyIcon from './prettify.svg';
import _ReloadIcon from './reload.svg';
import _RootTypeIcon from './root-type.svg';
import _SettingsIcon from './settings.svg';
import _StarFilledIcon from './star-filled.svg';
import _StarIcon from './star.svg';
import _StopIcon from './stop.svg';
import _TrashIcon from './trash.svg';
import _TypeIcon from './type.svg';

export const ArgumentIcon = generateIcon(_ArgumentIcon);
export const ChevronDownIcon = generateIcon(_ChevronDownIcon);
export const ChevronLeftIcon = generateIcon(_ChevronLeftIcon);
export const ChevronUpIcon = generateIcon(_ChevronUpIcon);
export const CloseIcon = generateIcon(_CloseIcon);
export const CopyIcon = generateIcon(_CopyIcon);
export const DeprecatedArgumentIcon = generateIcon(_DeprecatedArgumentIcon);
export const DeprecatedEnumValueIcon = generateIcon(_DeprecatedEnumValueIcon);
export const DeprecatedFieldIcon = generateIcon(_DeprecatedFieldIcon);
export const DirectiveIcon = generateIcon(_DirectiveIcon);
export const DocsFilledIcon = generateIcon(_DocsFilledIcon, 'filled docs icon');
export const DocsIcon = generateIcon(_DocsIcon);
export const EnumValueIcon = generateIcon(_EnumValueIcon);
export const FieldIcon = generateIcon(_FieldIcon);
export const HistoryIcon = generateIcon(_HistoryIcon);
export const ImplementsIcon = generateIcon(_ImplementsIcon);
export const KeyboardShortcutIcon = generateIcon(_KeyboardShortcutIcon);
export const MagnifyingGlassIcon = generateIcon(_MagnifyingGlassIcon);
export const MergeIcon = generateIcon(_MergeIcon);
export const PenIcon = generateIcon(_PenIcon);
export const PlayIcon = generateIcon(_PlayIcon);
export const PlusIcon = generateIcon(_PlusIcon);
export const PrettifyIcon = generateIcon(_PrettifyIcon);
export const ReloadIcon = generateIcon(_ReloadIcon);
export const RootTypeIcon = generateIcon(_RootTypeIcon);
export const SettingsIcon = generateIcon(_SettingsIcon);
export const StarFilledIcon = generateIcon(_StarFilledIcon, 'filled star icon');
export const StarIcon = generateIcon(_StarIcon);
export const StopIcon = generateIcon(_StopIcon);
export const TrashIcon = generateIcon(_TrashIcon, 'trash icon');
export const TypeIcon = generateIcon(_TypeIcon);

function generateIcon(
  RawComponent: any,
  title = RawComponent.name
    // Icon component name starts with `Svg${CamelCaseFilename without .svg}`
    .replace('Svg', '')
    // Insert a space before all caps
    .replaceAll(/([A-Z])/g, ' $1')
    .trimStart()
    .toLowerCase() + ' icon',
): FC<ComponentProps<'svg'>> {
  RawComponent.defaultProps = { title };
  return RawComponent;
}
