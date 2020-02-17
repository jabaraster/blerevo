#!/bin/sh
elm-format src/Index.elm --yes \
  & elm-format src/TestData.elm --yes \
  & elm-format src/Types.elm --yes \
  & elm-format src/Times.elm --yes 