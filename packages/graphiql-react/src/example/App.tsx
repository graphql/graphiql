import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as monaco from 'monaco-editor'
import "monaco-graphql"


export default function App() {
    const editorRef = useRef()
    useLayoutEffect(() => {
        const model = monaco.editor.createModel('query {}', 'graphql', monaco.Uri.file('operation.graphql'))
        monaco.editor.create(document.getElementById('root')!, {
            model
        })

    }, [])
  return <div ref={editorRef.current} />;
}
