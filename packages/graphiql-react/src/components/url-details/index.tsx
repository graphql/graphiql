import { FC } from 'react';
import './index.css';
import clsx from 'clsx';

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
    <div className={clsx('url-details', className)}>
      <span className="url-details-method">{method}</span>
      <span className="url-details-url">{url}</span>
    </div>
  );
};
