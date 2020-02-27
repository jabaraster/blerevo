module Times exposing (ZonedTime, omitSecond)

-- import Date exposing (Date)
-- import Iso8601

import DateFormat exposing (..)
import Time exposing (Posix, Zone)



-- import Time.Extra as TE


type alias ZonedTime =
    { time : Posix
    , zone : Zone
    }



-- parseDatetime : String -> Posix
-- parseDatetime s =
--     Result.withDefault (Time.millisToPosix 0) <| Iso8601.toTime s


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
