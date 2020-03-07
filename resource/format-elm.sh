#!/bin/sh
rm -fr ./.cache \
  & elm-format elm/Index.elm --yes \
  & elm-format elm/TestData.elm --yes \
  & elm-format elm/Types.elm --yes \
  & elm-format elm/Times.elm --yes 