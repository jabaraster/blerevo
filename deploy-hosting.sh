#!/bin/sh
cd resource \
  && parcel build index.html \
  && cp ./firebase-messaging-sw.js ./dist/ \
  && cd .. \
  && firebase deploy --only hosting:test-blerevo