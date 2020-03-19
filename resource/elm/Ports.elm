port module Ports exposing (..)

import Json.Encode exposing (Value)
import Types exposing (..)
import Dict exposing (Dict)

port requestLoadCycles : String -> Cmd msg
port receiveCycles : (Value -> msg) -> Sub msg

port requestUpdateDefeatedTime : { server :String, bossIdAtServer:  String, time: Timestamp } -> Cmd msg

port receiveUpdate : (Value -> msg) -> Sub msg

port requestSelectReportText : () -> Cmd msg

port requestSaveViewOption : ViewOption -> Cmd msg
port requestGetViewOption : () -> Cmd msg
port receiveViewOption : (Value -> msg) -> Sub msg