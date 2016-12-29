#!/bin/bash -ex
V=$(cat extension/manifest.json | grep '"version"' | grep -o "\d*\.\d*\.\d*")
rm -f "one-click-screenshot-$V.zip"
cd extension
zip -r "../one-click-screenshot-$V.zip" . -x '*.git*' -x '*.DS_Store' -x '*Thumbs.db'
