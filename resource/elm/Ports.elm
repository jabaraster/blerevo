port module Ports exposing (..)

import Json.Encode exposing (Value)

port requestLoadCycles : String -> Cmd msg
port receiveCycles : (Value -> msg) -> Sub msg