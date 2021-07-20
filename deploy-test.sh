#!/bin/sh
cd resource \
  && rm -fr dist \
  && parcel build index.html \
  && \cp -f img/haskell-logo.png dist \
  && \cp -f img/hastool-logo.png dist \
  && \cp -f js/firebase-messaging-sw.js dist \
  && cd .. \
  && firebase deploy --only hosting:test-blerevo