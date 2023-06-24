#!/usr/bin/env bash

set -ueo pipefail

vscode-tmgrammar-test 'tests/unit/*.graphql' 2> >(grep -v 'grammar not found for' >&2)

if [[ "$*" == *-u* ]]; then
  vscode-tmgrammar-snap 'tests/snap/*.graphql' --updateSnapshot
else
  vscode-tmgrammar-snap 'tests/snap/*.graphql'
fi 2> >(grep -v 'grammar not found for' >&2)