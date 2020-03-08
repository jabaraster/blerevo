port module Ports exposing (..)

import Json.Encode exposing (Value)
import Types exposing (Timestamp)

port requestLoadCycles : String -> Cmd msg
port receiveCycles : (Value -> msg) -> Sub msg

port requestUpdateDefeatedTime : { server :String, bossIdAtServer:  String, time: Timestamp } -> Cmd msg