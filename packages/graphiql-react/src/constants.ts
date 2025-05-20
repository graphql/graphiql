export const KEY_MAP = Object.freeze({
  prettify: ['Shift-Ctrl-P'],
  mergeFragments: ['Shift-Ctrl-M'],
  runQuery: ['Ctrl-Enter', 'Cmd-Enter'],
  autoComplete: ['Ctrl-Space'],
  copyQuery: ['Shift-Ctrl-C'],
  refetchSchema: ['Shift-Ctrl-R'],
  searchInEditor: ['Ctrl-F'],
  searchInDocs: ['Ctrl-K'],
} as const);

export const DEFAULT_QUERY = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and testing
# GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#   Prettify query:  ${KEY_MAP.prettify[0]} (or press the prettify button)
#
#  Merge fragments:  ${KEY_MAP.mergeFragments[0]} (or press the merge button)
#
#        Run Query:  ${KEY_MAP.runQuery[0]} (or press the play button)
#
#    Auto Complete:  ${KEY_MAP.autoComplete[0]} (or just start typing)
#

`;
