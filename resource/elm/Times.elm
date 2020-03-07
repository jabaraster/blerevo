module Times exposing (ZonedTime, addHour, omitSecond)

-- import Date exposing (Date)
-- import Iso8601

import DateFormat exposing (..)
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


omitSecond : ZonedTime -> String
omitSecond time =
    DateFormat.format
        [ --   yearNumber
          -- , text "/"
          -- , monthFixed
          -- , text "/"
          -- , dayOfMonthFixed
          -- , text " "
          hourMilitaryFixed
        , text ":"
        , minuteFixed
        ]
        time.zone
        time.time



-- dateString : Date -> String
-- dateString =
--     Date.format "yyyy/MM/dd"
