module Types exposing (Area, FieldBossCycle, PopTime, Region, Timestamp, fieldBossCycleDecoder, nextPopTime, nextPopTimeOnly, nextPopTimePlain, timestampDecoder, timestampToPosix)

import Json.Decode as D exposing (Decoder)
import Time exposing (Posix)


type alias Region =
    String


type alias Area =
    String


type alias Timestamp =
    { seconds : Int, nanoseconds : Int }


timestampDecoder : Decoder Timestamp
timestampDecoder =
    D.map2 Timestamp
        (D.field "seconds" D.int)
        (D.field "nanoseconds" D.int)


type alias FieldBossCycle =
    { name : String
    , id : String
    , region : Region
    , area : Area
    , force : Bool
    , repopIntervalMinutes : Int
    , lastDefeatedTime : Posix
    , sortOrder : Int
    }


fieldBossCycleDecoder : Decoder FieldBossCycle
fieldBossCycleDecoder =
    D.map8 FieldBossCycle
        (D.field "name" D.string)
        (D.field "id" D.string)
        (D.field "region" D.string)
        (D.field "area" D.string)
        (D.field "force" D.bool)
        (D.field "repopIntervalMinutes" D.int)
        (D.field "lastDefeatedTime" timestampDecoder |> D.andThen (D.succeed << timestampToPosix))
        (D.field "sortOrder" D.int)


timestampToPosix : Timestamp -> Posix
timestampToPosix t =
    Time.millisToPosix 0


type alias PopTime =
    { time : Posix
    , remainSeconds : Int
    }


nextPopTime : FieldBossCycle -> Posix -> PopTime
nextPopTime boss now =
    nextPopTimePlain boss.lastDefeatedTime boss.repopIntervalMinutes now


nextPopTimePlain : Posix -> Int -> Posix -> PopTime
nextPopTimePlain last intervalMinutes now =
    let
        nowMillis =
            Time.posixToMillis now

        next =
            nextPopTimeOnly last intervalMinutes now

        remainMillis =
            Time.posixToMillis next - Time.posixToMillis now
    in
    { time = next
    , remainSeconds = round <| toFloat remainMillis / 1000
    }


nextPopTimeOnly : Posix -> Int -> Posix -> Posix
nextPopTimeOnly last intervalMinutes now =
    let
        nowMillis =
            Time.posixToMillis now

        nextMillis =
            (1000 * 60 * intervalMinutes) + Time.posixToMillis last
    in
    if nextMillis > nowMillis then
        Time.millisToPosix nextMillis

    else
        nextPopTimeOnly (Time.millisToPosix nextMillis) intervalMinutes now
