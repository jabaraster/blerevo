module Types exposing (Area, FieldBossCycle, PopTime, Region, Timestamp, fieldBossCycleDecoder, nextPopTime, nextPopTimePlain, posixToTimestamp, timestampDecoder, timestampToPosix)

import Json.Decode as D exposing (Decoder)
import Json.Decode.Pipeline as DP
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
    , serverId : String
    , region : Region
    , area : Area
    , force : Bool
    , repopIntervalMinutes : Int
    , lastDefeatedTime : Posix
    , sortOrder : Int
    }


fieldBossCycleDecoder : Decoder FieldBossCycle
fieldBossCycleDecoder =
    D.succeed FieldBossCycle
        |> DP.required "name" D.string
        |> DP.required "id" D.string
        |> DP.required "serverId" D.string
        |> DP.required "region" D.string
        |> DP.required "area" D.string
        |> DP.required "force" D.bool
        |> DP.required "repopIntervalMinutes" D.int
        |> DP.required "lastDefeatedTime" (timestampDecoder |> D.andThen (D.succeed << timestampToPosix))
        |> DP.required "sortOrder" D.int


timestampToPosix : Timestamp -> Posix
timestampToPosix t =
    let
        millis =
            t.seconds * 1000 + round (toFloat t.nanoseconds / 1000)
    in
    Time.millisToPosix millis


posixToTimestamp : Posix -> Timestamp
posixToTimestamp p =
    let
        millis =
            Time.posixToMillis p
    in
    { seconds = round (toFloat millis / 1000), nanoseconds = 0 }


type alias PopTime =
    { time : Posix
    , remainSeconds : Int
    , preTime : Posix
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
            nextPopTimeInternal last intervalMinutes now

        remainMillis =
            Time.posixToMillis next.time - Time.posixToMillis now
    in
    { time = next.time
    , remainSeconds = round <| toFloat remainMillis / 1000
    , preTime = next.preTime
    }


nextPopTimeInternal : Posix -> Int -> Posix -> { time : Posix, preTime : Posix }
nextPopTimeInternal last intervalMinutes now =
    let
        nowMillis =
            Time.posixToMillis now

        nextMillis =
            (1000 * 60 * intervalMinutes) + Time.posixToMillis last
    in
    if nextMillis > nowMillis then
        { time = Time.millisToPosix nextMillis, preTime = last }

    else
        nextPopTimeInternal (Time.millisToPosix nextMillis) intervalMinutes now
