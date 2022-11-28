/* eslint-disable no-alert */
import {
  Button,
  ReloadIcon,
  UnStyledButton,
} from '../../../packages/graphiql-react';
import '../../../packages/graphiql-react/font/roboto.css';
import '../../../packages/graphiql-react/font/fira-code.css';
import '../../../packages/graphiql-react/dist/style.css';

export const ButtonStory = () => {
  return (
    <Button
      type="button"
      onClick={() => alert('click!')}
      className="graphiql-container"
    >
      {`I'm a Button`}
    </Button>
  );
};

export const UnstyledButtonStory = () => {
  return (
    <UnStyledButton
      type="button"
      onClick={() => alert('click!')}
      aria-label="Re-fetch GraphQL schema"
    >
      <ReloadIcon aria-hidden="true" />
    </UnStyledButton>
  );
};
