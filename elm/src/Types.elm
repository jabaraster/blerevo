module Types exposing (..)

import Time exposing (Posix)


type alias Region =
    String


type alias Area =
    String


type alias FieldBossCycle =
    { name : String
    , id : String
    , region : Region
    , area : Area
    , force : Bool
    , sortOrder : Int
    , repopIntervalMinutes : Int
    , lastDefeatedTime : Posix
    }


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
