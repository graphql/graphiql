#!/bin/sh
#
# Copyright (c) Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

set -e

BINARIES=$(find node_modules/.bin -type l -maxdepth 1 -mindepth 1)

for PACKAGE in $(find packages -type d -maxdepth 1 -mindepth 1); do
  BIN_DIR="$PACKAGE/node_modules/.bin"
  mkdir -pv "$BIN_DIR"
  for BINARY in $BINARIES; do
    (cd "$BIN_DIR" && ln -sfv "../../../../$BINARY")
  done
done
