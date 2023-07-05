#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/dist/test"
export CODE_TESTS_WORKSPACE="$(pwd)/fixtures"

node "$(pwd)/dist/test/runTests"
