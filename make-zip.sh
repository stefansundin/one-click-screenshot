#!/bin/bash -ex
V=$(cat extension/manifest.json | jq -Mr .version)
rm -f "one-click-screenshot-$V.zip"
cd extension
zip -r "../one-click-screenshot-$V.zip" . -x '*.git*' -x '*.DS_Store' -x '*Thumbs.db'
