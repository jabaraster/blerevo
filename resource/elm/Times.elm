module Times exposing (..)

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


addHour : Int -> ZonedTime -> ZonedTime
addHour hour zonedTime =
    { zone = zonedTime.zone
    , time = Time.Extra.add Hour hour zonedTime.zone zonedTime.time
    }


hourMinuteToPosix : ZonedTime -> String -> Maybe Posix
hourMinuteToPosix today s =
    let
        mHourMinute =
            Result.toMaybe <| Parser.run hourMinuteParser s
    in
        Maybe.map (Time.Extra.partsToPosix today.zone) <|
        Maybe.map
            (\hm ->
                let
                    nowParts =
                        Time.Extra.posixToParts today.zone today.time
                in
                { nowParts
                    | hour = hm.hour
                    , minute = hm.minute
                    , second = 0
                    , millisecond = 0
                }
            )
            mHourMinute


type alias HourMinute =
    { hour: Int, minute: Int }


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


minuteSecond : ZonedTime -> String
minuteSecond time =
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
