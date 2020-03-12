/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';
import { Children } from 'react';

const Divider = ({ innerSx }) => (
  <div
    data-is-divider
    aria-hidden
    sx={{
      ...innerSx,
      background: ({ colors }) => colors.border,
      width: '1px',
    }}
  />
);
Divider.propTypes = { innerSx: PropTypes.object };

const WithDividers = ({ children, padding = false, ...props }) => {
  return (
    <ul
      data-contains-divider
      {...props}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        '[data-contains-divider] [data-is-divider]': {
          display: 'none',
        },
      }}>
      {Children.map(children, (child, index) => {
        const isFirst = index === 0;
        return (
          <li
            sx={{
              position: 'relative',
              display: 'grid',
              marginLeft:
                padding && !isFirst
                  ? ({ spaces }) => spaces.rowPadding * 2
                  : undefined,
            }}>
            {!isFirst && (
              <Divider
                innerSx={{
                  position: 'absolute',
                  top: ({ space }) => space[2],
                  bottom: ({ space }) => space[2],
                  left:
                    padding && !isFirst
                      ? ({ spaces }) => spaces.rowPadding * -1
                      : 0,
                }}
              />
            )}
            {child}
          </li>
        );
      })}
    </ul>
  );
};
WithDividers.propTypes = { padding: PropTypes.bool };

export default WithDividers;
