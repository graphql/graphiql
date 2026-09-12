import type { FC, ReactNode } from 'react';
import './index.css';

export type PanelHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export const PanelHeader: FC<PanelHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <header className="graphiql-panel-header">
    <div className="graphiql-panel-header-titles">
      <h2 className="graphiql-panel-header-title">{title}</h2>
      {subtitle && <p className="graphiql-panel-header-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="graphiql-panel-header-actions">{actions}</div>}
  </header>
);
