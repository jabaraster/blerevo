#/bin/sh
parcel build index.html \
  && aws s3 sync ./dist/ s3://fb.hastool.me/
