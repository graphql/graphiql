import _ChevronDownIcon from './chevron-down.svg';
import _ChevronUpIcon from './chevron-up.svg';

export const ChevronDownIcon = generateIcon(
  _ChevronDownIcon,
  'chevron down icon',
);
export const ChevronUpIcon = generateIcon(_ChevronUpIcon, 'chevron up icon');

function generateIcon(RawComponent: any, title: string) {
  const WithTitle = function IconComponent(
    props: JSX.IntrinsicElements['svg'],
  ) {
    return <RawComponent {...props} title={title} />;
  };
  Object.defineProperty(WithTitle, 'name', { value: RawComponent.name });
  return WithTitle;
}
