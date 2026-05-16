import type { FC } from 'react';
import { useGraphiQL } from '../provider';
import './index.css';

export const SidePanel: FC = () => {
  const visiblePlugin = useGraphiQL(state => state.visiblePlugin);
  if (!visiblePlugin) {
    return null;
  }
  const Content = visiblePlugin.content;
  return (
    <aside className="graphiql-side-panel" aria-label={visiblePlugin.title}>
      <Content />
    </aside>
  );
};
