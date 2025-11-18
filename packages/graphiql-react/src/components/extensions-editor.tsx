import { FC, useEffect, useRef } from 'react';
import { useGraphiQL, useGraphiQLActions } from './provider';
import type { EditorProps } from '../types';
import { KEY_BINDINGS, STORAGE_KEY, URI_NAME } from '../constants';
import {
    getOrCreateModel,
    createEditor,
    useChangeHandler,
    onEditorContainerKeyDown,
    cleanupDisposables,
    cn,
    pick,
} from '../utility';
import { useMonaco } from '../stores';

interface ExtensionsEditorProps extends EditorProps {
    /**
     * Invoked when the contents of the extensions editor change.
     * @param value - The new contents of the editor.
     */
    onEdit?(value: string): void;
}

export const ExtensionsEditor: FC<ExtensionsEditorProps> = ({
    onEdit,
    ...props
}) => {
    const { setEditor, run, prettifyEditors, mergeQuery } = useGraphiQLActions();
    const { initialExtensions, uriInstanceId } = useGraphiQL(
        pick('initialExtensions', 'uriInstanceId'),
    );
    const ref = useRef<HTMLDivElement>(null!);
    const monaco = useMonaco(state => state.monaco);
    useChangeHandler(onEdit, STORAGE_KEY.extensions, 'extensions');
    useEffect(() => {
        if (!monaco) {
            return;
        }
        const model = getOrCreateModel({
            uri: `${uriInstanceId}${URI_NAME.extensions}`,
            value: initialExtensions,
        });
        const editor = createEditor(ref, { model });
        setEditor({ extensionsEditor: editor });
        const disposables = [
            editor.addAction({ ...KEY_BINDINGS.runQuery, run }),
            editor.addAction({ ...KEY_BINDINGS.prettify, run: prettifyEditors }),
            editor.addAction({ ...KEY_BINDINGS.mergeFragments, run: mergeQuery }),
            editor,
            model,
        ];
        return cleanupDisposables(disposables);
    }, [monaco]); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

    return (
        <div
            ref={ref}
            tabIndex={0}
            onKeyDown={onEditorContainerKeyDown}
            {...props}
            className={cn('graphiql-editor', props.className)}
        />
    );
};

