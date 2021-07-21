port module Ports exposing (..)

import Json.Encode exposing (Value)
import Types exposing (..)


port requestLoadCycles : String -> Cmd msg


port receiveCycles : (Value -> msg) -> Sub msg


port requestUpdateDefeatedTime : { server : String, bossIdAtServer : String, time : Timestamp, reliability : Bool } -> Cmd msg


port receiveUpdate : (Value -> msg) -> Sub msg


port requestSelectReportText : () -> Cmd msg


port requestSaveViewOption : ViewOption -> Cmd msg


port requestGetViewOption : () -> Cmd msg


port receiveViewOption : (Value -> msg) -> Sub msg


port receiveAuthStateChanged : (Value -> msg) -> Sub msg


port requestLogout : () -> Cmd msg


port receiveLogout : (() -> msg) -> Sub msg


port requestRegisterNotification : () -> Cmd msg
