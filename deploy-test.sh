#!/bin/sh
cd resource \
  && parcel build index.html \
  && cp img/haskell-logo.png \
  && cp img/hastool-logo.png \
  && cd .. \
  && firebase deploy --only hosting:test-blerevo