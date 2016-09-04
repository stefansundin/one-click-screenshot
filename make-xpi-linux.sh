#!/bin/bash -ex
coffee -b -c extension/js/*.coffee
cp -r extension/{js,img,css,*.html} firefox

V=$(cat firefox/manifest.json | grep '"version"' | grep -oP "\d+\.\d+\.\d+")
rm -f "one-click-screenshot-$V.xpi"
cd firefox
zip -r "../one-click-screenshot-$V.xpi" . -x '*.coffee' -x '*options*' -x '*.git*' -x '*.DS_Store' -x '*Thumbs.db'
