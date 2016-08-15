#!/bin/bash -ex
coffee -b -c extension/js/*.coffee

V=$(cat extension/manifest.json | grep '"version"' | grep -o "\d*\.\d*\.\d*")
rm -f "one-click-screenshot-$V.zip"
cd extension
zip -r "../one-click-screenshot-$V.zip" . -x '*.coffee' -x '*.git*' -x '*.DS_Store' -x '*Thumbs.db'
