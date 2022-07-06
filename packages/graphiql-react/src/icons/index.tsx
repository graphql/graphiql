import _ChevronDownIcon from './chevron-down.svg';
import _ChevronUpIcon from './chevron-up.svg';
import _CopyIcon from './copy.svg';
import _MergeIcon from './merge.svg';
import _PlayIcon from './play.svg';
import _PrettifyIcon from './prettify.svg';
import _StopIcon from './stop.svg';

export const ChevronDownIcon = generateIcon(
  _ChevronDownIcon,
  'chevron down icon',
);
export const ChevronUpIcon = generateIcon(_ChevronUpIcon, 'chevron up icon');
export const CopyIcon = generateIcon(_CopyIcon, 'copy icon');
export const MergeIcon = generateIcon(_MergeIcon, 'merge icon');
export const PlayIcon = generateIcon(_PlayIcon, 'play icon');
export const PrettifyIcon = generateIcon(_PrettifyIcon, 'prettify icon');
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
