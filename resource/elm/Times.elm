module Times exposing (HourMinute, ZonedTime, addDay, addHour, addMinute, checkTimeNumber, checkTwoDigits, fullFormat, hourMinute, hourMinuteParser, hourMinuteToPosix, isValidHourMinute, omitSecond, twoDigitsNumberParser)

import DateFormat exposing (..)
import Parser exposing (..)
import Time exposing (Posix, Zone)
import Time.Extra exposing (Interval(..))


type alias ZonedTime =
    { time : Posix
    , zone : Zone
    }



-- parseDatetime : String -> Posix
-- parseDatetime s =
--     Result.withDefault (Time.millisToPosix 0) <| Iso8601.toTime s


addMinute : Int -> ZonedTime -> ZonedTime
addMinute val zonedTime =
    { zone = zonedTime.zone
    , time = Time.Extra.add Minute val zonedTime.zone zonedTime.time
    }


addHour : Int -> ZonedTime -> ZonedTime
addHour val zonedTime =
    { zone = zonedTime.zone
    , time = Time.Extra.add Hour val zonedTime.zone zonedTime.time
    }


addDay : Int -> ZonedTime -> ZonedTime
addDay val zonedTime =
    { zone = zonedTime.zone
    , time = Time.Extra.add Day val zonedTime.zone zonedTime.time
    }


isValidHourMinute : String -> Bool
isValidHourMinute s =
    case Parser.run hourMinuteParser s of
        Ok _ ->
            True

        Err _ ->
            False


hourMinuteToPosix : ZonedTime -> String -> Maybe Posix
hourMinuteToPosix now s =
    let
        mHourMinute =
            Result.toMaybe <| Parser.run hourMinuteParser s
    in
    Maybe.map
        (\hm ->
            let
                nowParts =
                    Time.Extra.posixToParts now.zone now.time
            in
            { nowParts
                | hour = hm.hour
                , minute = hm.minute
                , second = 0
                , millisecond = 0
            }
        )
        mHourMinute
        |> Maybe.map (Time.Extra.partsToPosix now.zone)
        |> Maybe.map
            (\p ->
                if Time.posixToMillis now.time > Time.posixToMillis p then
                    p

                else
                    (addDay -1 { zone = now.zone, time = p }).time
            )


type alias HourMinute =
    { hour : Int, minute : Int }


hourMinuteParser : Parser.Parser HourMinute
hourMinuteParser =
    Parser.succeed HourMinute
        |= twoDigitsNumberParser
        |. Parser.symbol ":"
        |= twoDigitsNumberParser


twoDigitsNumberParser : Parser.Parser Int
twoDigitsNumberParser =
    Parser.getChompedString (Parser.chompWhile Char.isDigit)
        |> Parser.andThen checkTwoDigits


checkTwoDigits : String -> Parser.Parser Int
checkTwoDigits s =
    if String.length s == 2 then
        case String.toInt s of
            Nothing ->
                Parser.problem <| s ++ " is not number."

            Just i ->
                Parser.succeed i
                    |> Parser.andThen checkTimeNumber

    else
        Parser.problem <| s ++ " is not two digits."


checkTimeNumber : Int -> Parser.Parser Int
checkTimeNumber i =
    if i < 0 then
        Parser.problem "not time number."

    else if i > 60 then
        Parser.problem "not time number."

    else
        Parser.succeed i


hourMinute : ZonedTime -> String
hourMinute time =
    DateFormat.format
        [ hourMilitaryFixed
        , text ":"
        , minuteFixed
        ]
        time.zone
        time.time


omitSecond : ZonedTime -> String
omitSecond time =
    DateFormat.format
        [ --   yearNumber
          -- , text "/"
          monthFixed
        , text "/"
        , dayOfMonthFixed
        , text " "
        , hourMilitaryFixed
        , text ":"
        , minuteFixed
        ]
        time.zone
        time.time


fullFormat : ZonedTime -> String
fullFormat time =
    DateFormat.format
        [ yearNumber
        , text "/"
        , monthFixed
        , text "/"
        , dayOfMonthFixed
        , text " "
        , hourMilitaryFixed
        , text ":"
        , minuteFixed
        ]
        time.zone
        time.time



-- dateString : Date -> String
-- dateString =
--     Date.format "yyyy/MM/dd"
