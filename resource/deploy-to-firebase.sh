#/bin/sh
parcel build index.html \
  && firebase deploy --only hosting