#!/bin/sh
mkdir -p "$DATA_DIR" && chown -R node:node "$DATA_DIR"
exec su-exec node "$@"
