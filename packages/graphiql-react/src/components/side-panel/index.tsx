import type { ComponentType, FC } from 'react';
import { useGraphiQL } from '../provider';
import './index.css';

type Plugin = {
  title: string;
  content: ComponentType;
};

export const SidePanel: FC = () => {
  const visiblePlugin = useGraphiQL(state => state.visiblePlugin);
  if (!visiblePlugin) {
    return null;
  }
  return <SidePanelView plugin={visiblePlugin} />;
};

export type SidePanelViewProps = {
  plugin: Plugin;
};

export const SidePanelView: FC<SidePanelViewProps> = ({ plugin }) => {
  const Content = plugin.content;
  return (
    <aside className="graphiql-side-panel" aria-label={plugin.title}>
      <Content />
    </aside>
  );
};
