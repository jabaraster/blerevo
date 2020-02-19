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
    , remainMinutes : Int
    }


nextPopTime : FieldBossCycle -> Posix -> PopTime
nextPopTime boss now =
    nextPopTimePlain boss.lastDefeatedTime boss.repopIntervalMinutes now


nextPopTimePlain : Posix -> Int -> Posix -> PopTime
nextPopTimePlain last intervalMinutes now =
    let
        nextMillis =
            (1000 * 60 * intervalMinutes) + Time.posixToMillis last

        remainMillis =
            nextMillis - Time.posixToMillis now
    in
    { time = Time.millisToPosix nextMillis
    , remainMinutes = round <| toFloat remainMillis / 1000 / 60
    }
