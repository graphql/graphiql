import type { FC } from 'react';
import { cn } from '../../utility';
import './index.css';

interface UrlDetailsProps {
  /**
   * Additional classes to apply to the component
   */
  className?: string;

  /**
   * The GraphQL server url
   */
  url: string;

  /**
   * The HTTP fetch method
   */
  method?: string;
}

export const UrlDetails: FC<UrlDetailsProps> = ({ className, url, method }) => {
  return (
    <div className={cn('url-details', className)}>
      <span className="url-details-method">{method}</span>
      <span className="url-details-url">{url}</span>
    </div>
  );
};
