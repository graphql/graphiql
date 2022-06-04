import _ChevronDownIcon from './chevron-down.svg';
import _ChevronUpIcon from './chevron-up.svg';
import _CopyIcon from './copy.svg';
import _DocsIcon from './docs.svg';
import _HistoryIcon from './history.svg';
import _KeyboardShortcutIcon from './keyboard-shortcut.svg';
import _MergeIcon from './merge.svg';
import _PenIcon from './pen.svg';
import _PlayIcon from './play.svg';
import _PrettifyIcon from './prettify.svg';
import _SettingsIcon from './settings.svg';
import _StarFilledIcon from './star-filled.svg';
import _StarIcon from './star.svg';
import _StopIcon from './stop.svg';

export const ChevronDownIcon = generateIcon(
  _ChevronDownIcon,
  'chevron down icon',
);
export const ChevronUpIcon = generateIcon(_ChevronUpIcon, 'chevron up icon');
export const CopyIcon = generateIcon(_CopyIcon, 'copy icon');
export const DocsIcon = generateIcon(_DocsIcon, 'docs icon');
export const HistoryIcon = generateIcon(_HistoryIcon, 'history icon');
export const KeyboardShortcutIcon = generateIcon(
  _KeyboardShortcutIcon,
  'keyboard shortcut icon',
);
export const MergeIcon = generateIcon(_MergeIcon, 'merge icon');
export const PenIcon = generateIcon(_PenIcon, 'pen icon');
export const PlayIcon = generateIcon(_PlayIcon, 'play icon');
export const PrettifyIcon = generateIcon(_PrettifyIcon, 'prettify icon');
export const SettingsIcon = generateIcon(_SettingsIcon, 'settings icon');
export const StarFilledIcon = generateIcon(_StarFilledIcon, 'filled star icon');
export const StarIcon = generateIcon(_StarIcon, 'star icon');
export const StopIcon = generateIcon(_StopIcon, 'stop icon');

function generateIcon(RawComponent: any, title: string) {
  const WithTitle = function IconComponent(
    props: JSX.IntrinsicElements['svg'],
  ) {
    return <RawComponent {...props} title={title} />;
  };
  Object.defineProperty(WithTitle, 'name', { value: RawComponent.name });
  return WithTitle;
}
