/** @jsx jsx */
import { jsx } from 'theme-ui';
import { Card, CardRow, CardRowText } from './LayoutBlocks';

export default { title: 'Layout Cards' };

export const withFlexChild = () => (
  <div
    sx={{
      padding: 2,
      height: '100vh',
      display: 'grid',
      gridTemplate: '100% / 100%',
    }}>
    <Card>
      <CardRow>
        <CardRowText>{'Title'}</CardRowText>
      </CardRow>
      <CardRow flex>
        <CardRowText>
          {'This child is looooong'}
          {Array(300)
            .fill('scroll')
            .map((c, i) => (
              <div key={i}>{c}</div>
            ))}
        </CardRowText>
      </CardRow>
    </Card>
  </div>
);

export const withStackedRows = () => (
  <div
    sx={{
      padding: 2,
      height: '100vh',
      display: 'grid',
      gridTemplate: '100% / 100%',
    }}>
    <Card>
      <CardRow>
        <CardRowText>{'Header'}</CardRowText>
      </CardRow>
      <CardRow>
        <CardRowText>{'Navigation'}</CardRowText>
      </CardRow>
      <CardRow>
        <CardRowText>{'Search'}</CardRowText>
      </CardRow>
      <CardRow>
        <CardRowText>{'Filter'}</CardRowText>
      </CardRow>
      <CardRow flex>
        <CardRowText>{'Actual content'}</CardRowText>
      </CardRow>
      <CardRow>
        <CardRowText>{'Footer'}</CardRowText>
      </CardRow>
      <CardRow>
        <CardRowText>{'Footers footer'}</CardRowText>
      </CardRow>
    </Card>
  </div>
);
