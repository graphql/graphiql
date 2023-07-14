import { MarkdownContent } from '../../ui';

import './deprecation-reason.css';

type DeprecationReasonProps = {
  /**
   * The deprecation reason as markdown string.
   */
  children?: string | null;
  preview?: boolean;
};

export function DeprecationReason(props: DeprecationReasonProps) {
  return props.children ? (
    <div className="graphiql-doc-explorer-deprecation">
      <div className="graphiql-doc-explorer-deprecation-label">Deprecated</div>
      <MarkdownContent
        type="deprecation"
        onlyShowFirstChild={props.preview ?? true}
      >
        {props.children}
      </MarkdownContent>
    </div>
  ) : null;
}
