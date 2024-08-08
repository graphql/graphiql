import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronDownIcon, ChevronUpIcon } from '../../icons';
import { UnStyledButton } from '../../ui';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from '../common';
import { useSynchronizeOption } from '../hooks';
import { IncrementalPayload } from '../tabs';
import { CodeMirrorEditor, CommonEditorProps } from '../types';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/info.css';
import '../style/jump.css';
import '../style/auto-insertion.css';
import '../style/editor.css';
import '../style/increments-editors.css';

type UseIncrementsEditorArgs = CommonEditorProps & {
  increment: IncrementalPayload;
};

function useIncrementsEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  increment,
}: UseIncrementsEditorArgs) {
  const [editor, setEditor] = useState<CodeMirrorEditor | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;
    void importCodeMirror(
      [
        import('codemirror/addon/fold/foldgutter'),
        import('codemirror/addon/fold/brace-fold'),
        import('codemirror/addon/dialog/dialog'),
        import('codemirror/addon/search/search'),
        import('codemirror/addon/search/searchcursor'),
        import('codemirror/addon/search/jump-to-line'),
        // @ts-expect-error
        import('codemirror/keymap/sublime'),
        import('codemirror-graphql/esm/results/mode'),
        import('codemirror-graphql/esm/utils/info-addon'),
      ],
      { useCommonAddons: false },
    ).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: JSON.stringify(increment.payload, null, 2),
        lineWrapping: true,
        readOnly: true,
        theme: editorTheme,
        mode: 'graphql-results',
        foldGutter: true,
        gutters: ['CodeMirror-foldgutter'],
        // @ts-expect-error
        info: true,
        extraKeys: commonKeys,
      });

      setEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, increment.payload]);

  useSynchronizeOption(editor, 'keyMap', keyMap);

  return ref;
}

function IncrementEditor(
  props: UseIncrementsEditorArgs & { isInitial: boolean },
) {
  const [isOpen, setIsOpen] = useState(false);
  const incrementEditor = useIncrementsEditor(props);

  const toggleEditor = useCallback(() => setIsOpen(current => !current), []);

  return (
    <div
      className="graphiql-increment-editor"
      style={isOpen ? { height: '30vh' } : {}}
    >
      <UnStyledButton
        className="graphiql-increment-editor-toggle"
        onClick={toggleEditor}
      >
        {props.isInitial ? 'Initial payload' : 'Increment'} (after{' '}
        {props.increment.timing / 1000}s)
        {isOpen ? (
          <ChevronUpIcon className="graphiql-increment-editor-chevron" />
        ) : (
          <ChevronDownIcon className="graphiql-increment-editor-chevron" />
        )}
      </UnStyledButton>
      <div
        ref={incrementEditor}
        className={`graphiql-editor ${isOpen ? '' : 'hidden'}`}
      />
    </div>
  );
}

export type IncrementsEditorsProps = CommonEditorProps & {
  incrementalPayloads: IncrementalPayload[];
};

export function IncrementsEditors(props: IncrementsEditorsProps) {
  return (
    <div className="graphiql-increments-editors">
      {props.incrementalPayloads.map((increment, index) => (
        <IncrementEditor
          key={increment.timing}
          isInitial={index === 0}
          increment={increment}
          {...props}
        />
      ))}
    </div>
  );
}
