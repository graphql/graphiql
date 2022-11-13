import {
  Button,
  UnStyledButton,
  KeyboardShortcutIcon,
} from '../../../../packages/graphiql-react';

export const UnstyledButtonStory = () => {
  return (
    <UnStyledButton
      type="button"
      // eslint-disable-next-line no-alert
      onClick={() => alert('short-keys')}
      aria-label="Open short keys dialog"
    >
      <KeyboardShortcutIcon aria-hidden="true" />
    </UnStyledButton>
  );
};

UnstyledButtonStory.storyName = 'UnstyledButton';

export const ButtonStory = () => {
  return (
    // eslint-disable-next-line no-alert
    <Button type="button" className="none" onClick={() => alert('setTheme')}>
      System
    </Button>
  );
};

ButtonStory.storyName = 'Button';
