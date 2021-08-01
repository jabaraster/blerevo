module Types exposing (Area, FieldBossCycle, FieldBossId, HastoolUser, PopTime, Region, SortPolicy(..), Timestamp, ToggleState, UserNotification, ViewOption, fieldBossCycleDecoder, hastoolUserDecoder, nextPopTime, nextPopTimeInternal, nextPopTimePlain, posixToTimestamp, sortPolicyToString, stringToSortPolicy, timestampDecoder, timestampToPosix, toggleStateDecoder, userNotificationDecoder, viewOptionDecoder)

import Json.Decode as D exposing (Decoder)
import Json.Decode.Pipeline as DP
import Set exposing (Set)
import Time exposing (Posix)


type alias Region =
    String


type alias Area =
    String


type alias Timestamp =
    { seconds : Int, nanoseconds : Int }


type alias FieldBossId =
    String


timestampDecoder : Decoder Timestamp
timestampDecoder =
    D.map2 Timestamp
        (D.field "seconds" D.int)
        (D.field "nanoseconds" D.int)


type alias FieldBossCycle =
    { name : String
    , id : FieldBossId
    , serverId : String
    , region : Region
    , area : Area
    , force : Bool
    , repopIntervalMinutes : Int
    , lastDefeatedTime : Posix
    , sortOrder : Int
    , reliability : Bool
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
        |> DP.optional "reliability" D.bool False


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


type alias ToggleState =
    { name : String
    , toggle : Bool
    }


toggleStateDecoder : Decoder ToggleState
toggleStateDecoder =
    D.map2 ToggleState
        (D.field "name" D.string)
        (D.field "toggle" D.bool)


type alias ViewOption =
    { regionFilter : List ToggleState
    , forceFilter : List ToggleState
    , reliabilityFilter : List ToggleState
    , customFilter : List String
    , sortPolicy : String
    }


viewOptionDecoder : Decoder ViewOption
viewOptionDecoder =
    D.map5 ViewOption
        (D.field "regionFilter" <| D.list toggleStateDecoder)
        (D.field "forceFilter" <| D.list toggleStateDecoder)
        (D.andThen
            (\m ->
                case m of
                    Nothing ->
                        D.succeed [ { name = "信憑性あり", toggle = True }, { name = "信憑性なし", toggle = True } ]

                    Just l ->
                        D.succeed l
            )
            (D.maybe <| D.field "reliabilityFilter" <| D.list toggleStateDecoder)
        )
        (D.andThen
            (\m ->
                case m of
                    Nothing ->
                        D.succeed []

                    Just l ->
                        D.succeed l
            )
            (D.maybe <| D.field "customFilter" <| D.list D.string)
        )
        (D.field "sortPolicy" D.string)


type SortPolicy
    = NaturalOrder
    | NextPopTimeOrder


stringToSortPolicy : String -> SortPolicy
stringToSortPolicy s =
    case s of
        "NaturalOrder" ->
            NaturalOrder

        _ ->
            NextPopTimeOrder


sortPolicyToString : SortPolicy -> String
sortPolicyToString policy =
    case policy of
        NaturalOrder ->
            "NaturalOrder"

        NextPopTimeOrder ->
            "NextPopTimeOrder"


type alias HastoolUser =
    { uid : String
    , displayName : String
    }


hastoolUserDecoder : Decoder HastoolUser
hastoolUserDecoder =
    D.map2 HastoolUser
        (D.field "uid" D.string)
        (D.field "displayName" D.string)


type alias UserNotification =
    { notificationBossIds : Set FieldBossId
    }


userNotificationDecoder : Decoder UserNotification
userNotificationDecoder =
    D.map UserNotification
        (D.andThen
            (\l -> D.succeed <| Set.fromList l)
            (D.field "notificationBossIds" <| D.list D.string)
        )
