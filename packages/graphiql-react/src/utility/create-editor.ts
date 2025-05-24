import { KeyboardEventHandler, RefObject } from 'react';
import type { Uri } from '../monaco-editor';
import { editor as monacoEditor } from '../monaco-editor';
import { MonacoEditor } from '../types';

export const EDITOR_THEME = {
  dark: 'graphiql-DARK',
  light: 'graphiql-LIGHT',
};

export const onEditorContainerKeyDown: KeyboardEventHandler<
  HTMLDivElement
> = event => {
  const el = event.currentTarget;
  const isFocused = el === document.activeElement;
  if (isFocused && event.code === 'Enter') {
    event.preventDefault();
    el.querySelector('textarea')?.focus();
  }
};

export function getOrCreateModel({ uri, value }: { uri: Uri; value: string }) {
  const model = monacoEditor.getModel(uri);
  if (model) {
    // eslint-disable-next-line no-console
    console.info('✅ Model', uri.path, 'is already created');
    return model;
  }
  // eslint-disable-next-line no-console
  console.info('🚀 Model', uri.path, "isn't yet created, creating...");
  const language = uri.path.split('.').at(-1)!;
  return monacoEditor.createModel(value, language, uri);
}

const colors = {
  transparent: '#ffffff00',
  bg: {
    dark: '#212a3b',
    light: '#ffffffff',
  },
  primary: {
    dark: '#ff5794',
    light: '#d60590',
  },
  primaryBg: {
    dark: '#ff579419',
    light: '#d6059019',
  },
  secondary: {
    dark: '#b7c2d711',
    light: '#3b4b6811',
  },
};

const getBaseColors = (
  theme: 'dark' | 'light',
): monacoEditor.IStandaloneThemeData['colors'] => ({
  'editor.background': colors.transparent, // white with a 00 alpha value
  'scrollbar.shadow': colors.transparent, // Scrollbar shadow to indicate that the view is scrolled
  'textLink.foreground': colors.primary[theme], // Foreground color for links in text
  'textLink.activeForeground': colors.primary[theme], // Foreground color for active links in text
  'editorLink.activeForeground': colors.primary[theme], // Color of active links
  'editorHoverWidget.background': colors.bg[theme], // Background color of the editor hover
  'list.hoverBackground': colors.primaryBg[theme], // List/Tree background when hovering over items using the mouse
  'menu.background': colors.bg[theme], // Background color of the context menu

  'editorSuggestWidget.background': colors.bg[theme], // Background color of the suggest widget
  'editorSuggestWidget.selectedBackground': colors.primaryBg[theme], // Background color of the selected entry in the suggest widget
  'editorSuggestWidget.selectedForeground': colors.primary[theme], // Foreground color of the selected entry in the suggest widget
  'quickInput.background': colors.bg[theme],
  'highlighted.label': colors.primary[theme],
  'quickInput.widget': colors.primary[theme],
  highlight: colors.primary[theme],
  'editorWidget.background': colors.bg[theme], // Background color of editor widgets, such as find/replace
  'input.background': colors.secondary[theme], // Input box background
  focusBorder: colors.primary[theme], // Overall border color for focused elements. This color is only used if not overridden by a component
  'toolbar.hoverBackground': colors.primaryBg[theme],
  'inputOption.hoverBackground': colors.primaryBg[theme],
  'quickInputList.focusBackground': colors.primaryBg[theme],
  'editorWidget.resizeBorder': colors.primary[theme],
  'pickerGroup.foreground': colors.primary[theme], // Quick picker color for grouping labels

  'menu.selectionBackground': colors.primaryBg[theme], // hover background
  'menu.selectionForeground': colors.primary[theme], // hover text color

  // 'editorMarkerNavigationWarning.background': '#ffffff00', // Marker navigation widget warning color in the editor
  // 'editorMarkerNavigationError.background': '#FFFFFF00', // Marker navigation widget error color in the editor
  // 'editorOverviewRuler.border': '#ffffff00', // Color of the overview ruler border
  // 'editorBracketMatch.background': '#ffffff00', // Background color behind matching brackets
  // 'editor.lineHighlightBorder': '#ffffff00', // Background color for the border around the line at the cursor position
});

export const editorThemeDark: monacoEditor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: {
    ...getBaseColors('dark'),
    // 'editor.foreground': editorColors.dark.delimiters, // Default foreground color of the editor
    // 'editorCursor.foreground': editorColors.dark.yellow_default, // Color of the editor cursor
    // 'editor.selectionBackground': editorColors.dark.selections, // Color of the editor selection
    // 'editorLineNumber.foreground': editorColors.dark.delimiters, // Color of line numbers in the editor
    // 'editorLineNumber.activeForeground': editorColors.dark.delimitersActive, // Color of active line number in the editor
    // 'editorError.foreground': editorColors.dark.orange_default, // Foreground color of error squigglies in the editor
    // 'editorWarning.foreground': editorColors.dark.orange_default, // Foreground color of warning squigglies in the editor
    // 'editorBracketMatch.border': editorColors.dark.selections, // Color of matching bracket boxes
    // 'editorIndentGuide.background': editorColors.dark.indentGuides, // Color of indentation guides in the editor

    // A list of color names:
    // 'foreground': "#FFFFFF00", // Overall foreground color. This color is only used if not overridden by a component
    // 'errorForeground': "#FFFFFF00", // Overall foreground color for error messages. This color is only used if not overridden by a component
    // 'descriptionForeground': "#FFFFFF00", // Foreground color for description text providing additional information, for example for a label
    // 'contrastBorder': "#FFFFFF00", // An extra border around elements to separate them from others for greater contrast
    // 'contrastActiveBorder': "#FFFFFF00", // An extra border around active elements to separate them from others for greater contrast.
    // 'selection.background': "#FFFFFF00", // The background color of text selections in the workbench (e.g., for input fields or text areas). Note that this does not apply to selections within the editor
    // 'textSeparator.foreground': "#FFFFFF00", // Color for text separators
    // 'textPreformat.foreground': "#FFFFFF00", // Foreground color for preformatted text segments
    // 'textBlockQuote.background': "#FFFFFF00", // Background color for block quotes in text
    // 'textBlockQuote.border': "#FFFFFF00", // Border color for block quotes in text
    // 'textCodeBlock.background': "#FFFFFF00", // Background color for code blocks in text
    // 'widget.shadow': "#FFFFFF00", // Shadow color of widgets such as find/replace inside the editor
    // 'input.foreground': "#FFFFFF00", // Input box foreground
    // 'input.border': "#FFFFFF00", // Input box border
    // 'inputOption.activeBorder': "#FFFFFF00", // Border color of activated options in input fields
    // 'input.placeholderForeground': "#FFFFFF00", // Input box foreground color for placeholder text
    // 'inputValidation.infoBackground': "#FFFFFF00", // Input validation background color for information severity
    // 'inputValidation.infoBorder': "#FFFFFF00", // Input validation border color for information severity
    // 'inputValidation.warningBackground': "#FFFFFF00", // Input validation background color for information warning
    // 'inputValidation.warningBorder': "#FFFFFF00", // Input validation border color for warning severity
    // 'inputValidation.errorBackground': "#FFFFFF00", // Input validation background color for error severity
    // 'inputValidation.errorBorder': "#FFFFFF00", // Input validation border color for error severity
    // 'dropdown.background': "#FFFFFF00", // Dropdown background
    // 'dropdown.foreground': "#FFFFFF00", // Dropdown foreground
    // 'dropdown.border': "#FFFFFF00", // Dropdown border
    // 'list.focusBackground': "#FFFFFF00", // List/Tree background color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not
    // 'list.focusForeground': "#FFFFFF00", // List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not
    // 'list.activeSelectionBackground': "#FFFFFF00", // List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not
    // 'list.activeSelectionForeground': "#FFFFFF00", // List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not
    // 'list.inactiveSelectionBackground': "#FFFFFF00", // List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not
    // 'list.inactiveSelectionForeground': "#FFFFFF00", // List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not
    // 'list.hoverForeground': "#FFFFFF00", // List/Tree foreground when hovering over items using the mouse
    // 'list.dropBackground': "#FFFFFF00", // List/Tree drag and drop background when moving items around using the mouse
    // 'list.highlightForeground': "#FFFFFF00", // List/Tree foreground color of the match highlights when searching inside the list/tree
    // 'pickerGroup.border': "#FFFFFF00", // Quick picker color for grouping borders
    // 'button.foreground': "#FFFFFF00", // Button foreground color
    // 'button.background': "#FFFFFF00", // Button background color
    // 'button.hoverBackground': "#FFFFFF00", // Button background color when hovering
    // 'badge.background': "#FFFFFF00", // Badge background color. Badges are small information labels, e.g., for search results count
    // 'badge.foreground': "#FFFFFF00", // Badge foreground color. Badges are small information labels, e.g., for search results count
    // 'scrollbarSlider.background': "#FFFFFF00", // Slider background color
    // 'scrollbarSlider.hoverBackground': "#FFFFFF00", // Slider background color when hovering
    // 'scrollbarSlider.activeBackground': "#FFFFFF00", // Slider background color when active
    // 'progressBar.background': "#FFFFFF00", // Background color of the progress bar that can show for long running operations
    // 'editor.background': "#FFFFFF00", // Editor background color
    // 'editor.foreground': "#FFFFFF00", // Editor default foreground color
    // 'editorWidget.border': "#FFFFFF00", // Border color of editor widgets. The color is only used if the widget chooses to have a border and if the color is not overridden by a widget
    // 'editor.selectionBackground': "#FFFFFF00", // Color of the editor selection
    // 'editor.selectionForeground': "#FFFFFF00", // Color of the selected text for high contrast
    // 'editor.inactiveSelectionBackground': "#FFFFFF00", // Color of the selection in an inactive editor
    // 'editor.selectionHighlightBackground': "#FFFFFF00", // Color for regions with the same content as the selection
    // 'editor.findMatchBackground': "#FFFFFF00", // Color of the current search match
    // 'editor.findMatchHighlightBackground': "#FFFFFF00", // Color of the other search matches
    // 'editor.findRangeHighlightBackground': "#FFFFFF00", // Color the range limiting the search
    // 'editor.hoverHighlightBackground': "#FFFFFF00", // Highlight below the word for which a hover is shown

    // 'editorHoverWidget.border': "#FFFFFF00", // Border color of the editor hover
    // 'diffEditor.insertedTextBackground': "#FFFFFF00", // Background color for text that got inserted
    // 'diffEditor.removedTextBackground': "#FFFFFF00", // Background color for text that got removed
    // 'diffEditor.insertedTextBorder': "#FFFFFF00", // Outline color for the text that got inserted
    // 'diffEditor.removedTextBorder': "#FFFFFF00", // Outline color for text that got removed
    // 'editorOverviewRuler.currentContentForeground': "#FFFFFF00", // Current overview ruler foreground for inline merge-conflicts
    // 'editorOverviewRuler.incomingContentForeground': "#FFFFFF00", // Incoming overview ruler foreground for inline merge-conflicts
    // 'editorOverviewRuler.commonContentForeground': "#FFFFFF00", // Common ancestor overview ruler foreground for inline merge-conflicts
    // 'editor.lineHighlightBackground': "#FFFFFF00", // Background color for the highlight of line at the cursor position
    // 'editor.lineHighlightBorder': "#FFFFFF00", // Background color for the border around the line at the cursor position
    // 'editor.rangeHighlightBackground': "#FFFFFF00", // Background color of highlighted ranges, like by quick open and find features
    // 'editorCursor.foreground': "#FFFFFF00", // Color of the editor cursor
    // 'editorWhitespace.foreground': "#FFFFFF00", // Color of whitespace characters in the editor
    // 'editorIndentGuide.background': "#FFFFFF00", // Color of the editor indentation guides
    // 'editorLineNumber.foreground': "#FFFFFF00", // Color of editor line numbers
    // 'editorLineNumber.activeForeground': "#FFFFFF00", // Color of editor active line number
    // 'editorRuler.foreground': "#FFFFFF00", // Color of the editor rulers
    // 'editorCodeLens.foreground': "#FFFFFF00", // Foreground color of editor code lenses
    // 'editorInlayHint.foreground': "#FFFFFF00", // Foreground color of editor inlay hints
    // 'editorInlayHint.background': "#FFFFFF00", // Background color of editor inlay hints
    // 'editorBracketMatch.background': "#FFFFFF00", // Background color behind matching brackets
    // 'editorBracketMatch.border': "#FFFFFF00", // Color for matching brackets boxes
    // 'editorOverviewRuler.border': "#FFFFFF00", // Color of the overview ruler border
    // 'editorGutter.background': "#FFFFFF00", // Background color of the editor gutter. The gutter contains the glyph margins and the line numbers
    // 'editorError.foreground': "#FFFFFF00", // Foreground color of error squigglies in the editor
    // 'editorError.border': "#FFFFFF00", // Border color of error squigglies in the editor
    // 'editorWarning.foreground': "#FFFFFF00", // Foreground color of warning squigglies in the editor
    // 'editorWarning.border': "#FFFFFF00", // Border color of warning squigglies in the editor
    // 'editorMarkerNavigationError.background': "#FFFFFF00", // Editor marker navigation widget error color
    // 'editorMarkerNavigationWarning.background': "#FFFFFF00", // Editor marker navigation widget warning color
    // 'editorMarkerNavigation.background': "#FFFFFF00", // Editor marker navigation widget background
    // 'editorSuggestWidget.border': "#FFFFFF00", // Border color of the suggest widget
    // 'editorSuggestWidget.foreground': "#FFFFFF00", // Foreground color of the suggest widget
    // 'editorSuggestWidget.highlightForeground': "#FFFFFF00", // Color of the match highlights in the suggest widget
    // 'editor.wordHighlightBackground': "#FFFFFF00", // Background color of a symbol during read-access, like reading a variable
    // 'editor.wordHighlightStrongBackground': "#FFFFFF00", // Background color of a symbol during write-access, like writing to a variable
    // 'peekViewTitle.background': "#FFFFFF00", // Background color of the peek view title area
    // 'peekViewTitleLabel.foreground': "#FFFFFF00", // Color of the peek view title
    // 'peekViewTitleDescription.foreground': "#FFFFFF00", // Color of the peek view title info
    // 'peekView.border': "#FFFFFF00", // Color of the peek view borders and arrow
    // 'peekViewResult.background': "#FFFFFF00", // Background color of the peek view result list
    // 'peekViewResult.lineForeground': "#FFFFFF00", // Foreground color for line nodes in the peek view result list
    // 'peekViewResult.fileForeground': "#FFFFFF00", // Foreground color for file nodes in the peek view result list
    // 'peekViewResult.selectionBackground': "#FFFFFF00", // Background color of the selected entry in the peek view result list
    // 'peekViewResult.selectionForeground': "#FFFFFF00", // Foreground color of the selected entry in the peek view result list
    // 'peekViewEditor.background': "#FFFFFF00", // Background color of the peek view editor
    // 'peekViewEditorGutter.background': "#FFFFFF00", // Background color of the gutter in the peek view editor
    // 'peekViewResult.matchHighlightBackground': "#FFFFFF00", // Match highlight color in the peek view result list
    // 'peekViewEditor.matchHighlightBackground': "#FFFFFF00", // Match highlight color in the peek view editor
  },
  rules: [],
};

export const editorThemeLight: monacoEditor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  colors: {
    ...getBaseColors('light'),
    // 'editor.foreground': editorColors.light.delimiters, // Default foreground color in the editor
    // 'editorCursor.foreground': editorColors.light.yellow_default, // Color of the cursor in the editor
    // 'editor.selectionBackground': editorColors.light.selections, // Color of the selection in the editor
    // 'editorLineNumber.foreground': editorColors.light.delimiters, // Color of line numbers in the editor
    // 'editorLineNumber.activeForeground': editorColors.light.delimitersActive, // Color of active line number in the editor
    // 'editorError.foreground': editorColors.light.orange_default, // Foreground color of error squigglies in the editor
    // 'editorWarning.foreground': editorColors.light.orange_default, // Foreground color of warning squigglies in the editor
    // 'editorBracketMatch.border': editorColors.light.selections, // Color for matching bracket boxes in the editor
    // 'editorIndentGuide.background': editorColors.light.indentGuides, // Color of the indentation guides in the editor
  },
  rules: [],
};

// this should be called somewhere else, but fine here for now
monacoEditor.defineTheme(EDITOR_THEME.dark, editorThemeDark);
monacoEditor.defineTheme(EDITOR_THEME.light, editorThemeLight);

export function createEditor(
  domElement: RefObject<HTMLDivElement>,
  options: monacoEditor.IStandaloneEditorConstructionOptions,
): MonacoEditor {
  const { model } = options;
  if (!model) {
    throw new Error('options.model is required');
  }
  const language = model.uri.path.split('.').at(-1)!;

  return monacoEditor.create(domElement.current, {
    language,
    automaticLayout: true,
    fontSize: 15,
    minimap: { enabled: false }, // disable the minimap
    tabSize: 2,
    renderLineHighlight: 'none', // Remove a line selection border
    stickyScroll: { enabled: false }, // Disable sticky scroll widget
    overviewRulerLanes: 0, // remove unnecessary error highlight on the scroll
    scrollbar: {
      verticalScrollbarSize: 10,
    },
    scrollBeyondLastLine: false, // cleans up unnecessary "padding-bottom" on each editor
    fontFamily: '"Fira Code"',
    lineNumbersMinChars: 2, // reduce line numbers width on the left size
    tabIndex: -1, // Do not allow tabbing into the editor, only via by pressing Enter ot its container
    // scrollPredominantAxis: false,
    // wrappingStrategy: 'advanced',
    // fixedOverflowWidgets: true,
    ...options,
  });
}
