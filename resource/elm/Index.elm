module Index exposing (Model, Msg(..), Page(..), checkbox, circle, colorForRegion, fbIcon, filterText, forceLabel, forceText, getFilteredCycles, init, main, parseUrl, randomTimesGenerator, remainTimeText, setDefeatedTime, subscriptions, timeBarColorClass, timeBarWidth, update, view, viewBossTimeline)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav exposing (Key)
import Dict exposing (Dict)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode
import Json.Encode exposing (Value)
import List.Extra
import Ports
import Random exposing (Generator)
import Task
import TestData
import Time exposing (Posix, Zone)
import Time.Extra exposing (Interval(..))
import Times exposing (ZonedTime)
import Types exposing (..)
import Url exposing (Url)


server =
    "ケヤキ"


main : Platform.Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = LinkClicked
        , onUrlChange = UrlChanged
        }


type Page
    = IndexPage


type alias Model =
    { key : Key
    , page : Page
    , zone : Zone
    , now : Posix
    , regionFilter : Dict Region Bool
    , forceFilter : Dict String Bool
    , cycles : Result Json.Decode.Error (List FieldBossCycle)
    , error : Maybe Json.Decode.Error
    , editTarget : Maybe FieldBossCycle
    , editDefeatedTime : String
    }


type Msg
    = LinkClicked Browser.UrlRequest
    | UrlChanged Url
    | GetZone Zone
    | GetNowFirst Posix
    | GetNow Posix
    | GetRandomTimes (List Posix)
    | ToggleRegionFilter Region
    | ToggleForceFilter String
    | ReceiveCycles Value
    | StartEdit FieldBossCycle
    | ChangeEditDefeatedTime String
    | CancelEdit
    | SaveEdit FieldBossCycle Posix


init : () -> Url -> Key -> ( Model, Cmd Msg )
init _ url key =
    ( { key = key
      , page = parseUrl url
      , zone = Time.utc
      , now = Time.millisToPosix 0
      , regionFilter = Dict.fromList [ ( "大砂漠", False ), ( "水月平原", True ), ( "白青山脈", True ) ]
      , forceFilter = Dict.fromList [ ( "勢力ボス", False ), ( "非勢力ボス", True ) ]
      , cycles = Ok []
      , error = Nothing
      , editTarget = Nothing
      , editDefeatedTime = ""
      }
    , Cmd.batch
        [ Task.perform GetZone Time.here
        , Ports.requestLoadCycles server
        ]
    )


randomTimesGenerator : ZonedTime -> Int -> Generator (List Posix)
randomTimesGenerator now len =
    let
        min =
            Time.Extra.add Minute -120 now.zone now.time

        max =
            Time.Extra.add Hour 0 now.zone now.time
    in
    Random.map (List.map Time.millisToPosix) <|
        Random.list len (Random.int (Time.posixToMillis min) (Time.posixToMillis max))


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Time.every 1000 GetNow
        , Ports.receiveCycles ReceiveCycles
        ]


parseUrl : Url -> Page
parseUrl _ =
    IndexPage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Nav.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        UrlChanged url ->
            ( { model | page = parseUrl url }, Cmd.none )

        GetZone zone ->
            ( { model | zone = zone }, Task.perform GetNowFirst Time.now )

        GetNowFirst time ->
            ( { model | now = time }
            , Random.generate GetRandomTimes <|
                randomTimesGenerator { zone = model.zone, time = time } <|
                    List.length <|
                        Result.withDefault [] model.cycles
            )

        GetNow time ->
            ( { model | now = time }
            , Cmd.none
            )

        GetRandomTimes times ->
            ( { model | cycles = Result.map (setDefeatedTime times) model.cycles }, Cmd.none )

        ToggleRegionFilter region ->
            ( { model
                | regionFilter =
                    Dict.update region
                        (\mv -> Maybe.map not mv |> Maybe.withDefault True |> Just)
                        model.regionFilter
              }
            , Cmd.none
            )

        ToggleForceFilter f ->
            ( { model
                | forceFilter =
                    Dict.update f
                        (\mv -> Maybe.map not mv |> Maybe.withDefault True |> Just)
                        model.forceFilter
              }
            , Cmd.none
            )

        ReceiveCycles v ->
            ( { model | cycles = Json.Decode.decodeValue (Json.Decode.list Types.fieldBossCycleDecoder) v }, Cmd.none )

        StartEdit boss ->
            ( { model | editTarget = Just boss, editDefeatedTime = Times.omitSecond {zone = model.zone, time = model.now } }, Cmd.none )

        ChangeEditDefeatedTime s ->
            ( { model | editDefeatedTime = s }, Cmd.none )

        CancelEdit ->
            ( { model | editTarget = Nothing }, Cmd.none )

        SaveEdit boss t ->
            ( { model | editTarget = Nothing }, Ports.requestUpdateDefeatedTime { server = server, bossIdAtServer = boss.serverId, time = Types.posixToTimestamp t } )


setDefeatedTime : List Posix -> List FieldBossCycle -> List FieldBossCycle
setDefeatedTime numbers bossList =
    List.map
        (\( t, boss ) ->
            { boss | lastDefeatedTime = t }
        )
    <|
        List.Extra.zip numbers bossList


getFilteredCycles : Model -> List FieldBossCycle
getFilteredCycles model =
    List.filter
        (\boss ->
            let
                regionFilter =
                    Dict.get boss.region model.regionFilter
                        |> Maybe.withDefault True

                forceFilter =
                    Dict.get (forceText boss.force) model.forceFilter
                        |> Maybe.withDefault True
            in
            case ( regionFilter, forceFilter ) of
                ( True, True ) ->
                    True

                _ ->
                    False
        )
    <|
        Result.withDefault [] model.cycles


forceText : Bool -> String
forceText b =
    if b then
        "勢力ボス"

    else
        "非勢力ボス"


view : Model -> Document Msg
view model =
    let
        ordered =
            List.sortBy
                (\boss ->
                    let
                        nextTime =
                            Types.nextPopTime boss model.now
                    in
                    Time.posixToMillis nextTime.time
                )
            <|
                getFilteredCycles model

        nowWithZone =
            { zone = model.zone, time = model.now }
    in
    { title = "Field boss cycle | Blade and Soul Revolution"
    , body =
        viewEditor model nowWithZone
            ++ [ h5 [] [ text "Blade and Soul Revolution" ]
               , h1 [] [ text "Field boss cycle diagram" ]
               , p [] [ text "現在、ケヤキサーバの1chにしか対応していません。ご注意を。" ]
               , div [ class "filter-container" ]
                    [ ul [ class "filter region" ]
                        [ li [] [ filterText "大砂漠" model.regionFilter ToggleRegionFilter ]
                        , li [] [ filterText "水月平原" model.regionFilter ToggleRegionFilter ]
                        , li [] [ filterText "白青山脈" model.regionFilter ToggleRegionFilter ]
                        ]
                    ]
               , div [ class "filter-container" ]
                    [ ul [ class "filter region" ]
                        [ li [] [ filterText "勢力ボス" model.forceFilter ToggleForceFilter ]
                        , li [] [ filterText "非勢力ボス" model.forceFilter ToggleForceFilter ]
                        ]
                    ]
               , table [ class "main-contents" ]
                    [ thead []
                        [ tr []
                            [ td [] []
                            , td [ class "label-now" ] [ text <| "現在時刻: " ++ Times.omitSecond nowWithZone ]
                            , td [ class "label-now" ] [ text <| Times.omitSecond <| Times.addHour 1 nowWithZone ]
                            ]
                        ]
                    , tbody [] <| List.map (viewBossTimeline model.zone model.now) ordered
                    ]
               , h5 [] [ text "Powered by Haskell at ケヤキ server" ]
               , p [] [ text <| Maybe.withDefault "" <| Maybe.map Json.Decode.errorToString model.error ]
               ]
    }


viewEditor : Model -> ZonedTime -> List (Html Msg)
viewEditor model now =
    case model.editTarget of
        Nothing ->
            []

        Just boss ->
            [ div [ class "backdrop" ]
                [ div [ class "editor" ]
                    [ h5 [] [ text "編集中" ]
                    , div []
                        [ input [ type_ "time", value model.editDefeatedTime, onInput ChangeEditDefeatedTime ] []
                        , button [ onClick CancelEdit ] [ text "キャンセル" ]
                        , button [] [ text "保存" ]
                        ]
                    ]
                ]
            ]


filterText : String -> Dict String Bool -> (String -> msg) -> Html msg
filterText key dict action =
    let
        v =
            Dict.get key dict

        c =
            Maybe.withDefault True <| Dict.get key dict
    in
    checkbox key c <| action key


circle : String -> Html msg
circle th =
    div [ class <| "circle-" ++ th ++ "-container" ] [ div [ class <| "circle-" ++ th ] [] ]


viewBossTimeline : Zone -> Posix -> FieldBossCycle -> Html Msg
viewBossTimeline zone now boss =
    let
        nextPopTime =
            Types.nextPopTime boss now

        ldt =
            Times.omitSecond { zone = zone, time = boss.lastDefeatedTime }

        npt =
            Times.omitSecond { zone = zone, time = nextPopTime.time }

        repop =
            Types.nextPopTime boss now
    in
    tr []
        [ td [ class "boss-info" ]
            [ ul []
                [ li [] [ span [ class "label-boss-name", style "color" (colorForRegion boss.region) ] [ text boss.name ] ]
                , li [] [ fbIcon boss ]
                , li [ class "label-repop-time" ] [ text <| "再登場時間: " ++ String.fromInt boss.repopIntervalMinutes ++ "分" ]
                ]
            ]
        , td [ class "repop-info" ]
            [ ul
                []
                [ li [ class "label-region-and-area" ] [ text boss.region ]
                , li [ class "label-region-and-area" ] [ text boss.area ]
                , li []
                    [ span [] [ text <| "討伐時刻: " ++ ldt ]
                    , span [ class "fas fa-edit", onClick <| StartEdit boss ] []
                    ]
                , li [] [ text <| "登場時刻: " ++ npt ]
                ]
            ]
        , td [ class "time" ]
            [ span [ class "time-bar", class <| timeBarColorClass repop.remainSeconds, style "width" <| timeBarWidth repop now ]
                [ text <| "登場まで" ++ remainTimeText repop.remainSeconds
                ]
            ]
        ]


timeBarColorClass : Int -> String
timeBarColorClass remainSeconds =
    if remainSeconds < 180 then
        "time-bar-color-short"

    else if remainSeconds < 60 * 60 then
        "time-bar-color-middle"

    else
        "time-bar-color-long"


remainTimeText : Int -> String
remainTimeText remainSeconds =
    if remainSeconds < 180 then
        String.fromInt remainSeconds ++ "秒"

    else if remainSeconds < 60 * 60 then
        String.fromInt (remainSeconds // 60) ++ "分"

    else
        "1時間以上"


timeBarWidth : PopTime -> Posix -> String
timeBarWidth popTime now =
    let
        oneHourSeconds =
            60 * 60
    in
    if popTime.remainSeconds > oneHourSeconds then
        "100%"

    else
        String.fromFloat (toFloat (popTime.remainSeconds * 100) / toFloat oneHourSeconds) ++ "%"


fbIcon : FieldBossCycle -> Html msg
fbIcon boss =
    let
        forceClass =
            if boss.force then
                "force-boss"

            else
                "unforce-boss"
    in
    span [ class "container-fb-icon", class forceClass ]
        [ span [ class <| "fb-icon-" ++ boss.id ] []
        ]


forceLabel : FieldBossCycle -> Html msg
forceLabel boss =
    let
        c =
            if boss.force then
                "#c71585"

            else
                "#ffffff"
    in
    span [ style "background-color" c ] [ text "\u{3000}" ]


colorForRegion : Region -> String
colorForRegion r =
    case r of
        "大砂漠" ->
            "#cea877"

        "水月平原" ->
            "#000080"

        "白青山脈" ->
            "#696969"

        _ ->
            "#000000"


checkbox : String -> Bool -> msg -> Html msg
checkbox labelText checked_ handler =
    label [ class "checkbox", onClick handler ]
        [ span [ classList [ ( "fas fa-check", True ), ( "checked", checked_ ), ( "unchecked", not checked_ ) ] ] []
        , span [] [ text labelText ]
        ]
