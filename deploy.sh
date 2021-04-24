#!/bin/sh
cd resource \
  && parcel build index.html \
  && \cp -f img/haskell-logo.png dist \
  && \cp -f img/hastool-logo.png dist \
  && cd .. \
  && firebase deploy --only hosting:hastool-lineage