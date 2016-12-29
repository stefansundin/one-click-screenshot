#!/bin/bash -ex
cp -r extension/{img,css,*.html} firefox
cp extension/js/{background,popup}.js firefox/js/

V=$(cat firefox/manifest.json | grep '"version"' | grep -oP "\d+\.\d+\.\d+")
rm -f "one-click-screenshot-$V.xpi"
cd firefox
zip -r "../one-click-screenshot-$V.xpi" . -x '*options*' -x '*.git*' -x '*.DS_Store' -x '*Thumbs.db'
