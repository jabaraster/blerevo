port module Ports exposing (receiveAuthStateChanged, receiveCycles, receiveLogout, receiveRegisterNotification, receiveUpdate, receiveViewOption, requestGetViewOption, requestLoadCycles, requestLogout, requestRegisterNotification, requestSaveViewOption, requestSelectReportText, requestSwitchNotification, requestUpdateDefeatedTime)

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


port requestLogout : { server : String, uid : String } -> Cmd msg


port receiveLogout : (() -> msg) -> Sub msg


port requestRegisterNotification : { server : String, uid : String } -> Cmd msg


port receiveRegisterNotification : (Value -> msg) -> Sub msg


port requestSwitchNotification : { server : String, uid : String, bossId : FieldBossId } -> Cmd msg
