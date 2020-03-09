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
import Url.Parser


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
    = CyclePage String


type alias Model =
    { key : Key
    , page : Page
    , now : ZonedTime
    , regionFilter : Dict Region Bool
    , forceFilter : Dict String Bool
    , cycles : Result Json.Decode.Error (List FieldBossCycle)
    , error : Maybe Json.Decode.Error
    , editTarget : Maybe FieldBossCycle
    , defeatedTimeInputValue : String
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
    | ChangeDefeatedTimeInputValue String
    | NowDefeated
    | ChangeRemainMinutes FieldBossCycle String
    | CancelEdit
    | SaveEdit
    | ReceiveUpdate Value


init : () -> Url -> Key -> ( Model, Cmd Msg )
init _ url key =
    let
        page =
            parseUrl url
    in
    ( { key = key
      , page = page
      , now = { zone = Time.utc, time = Time.millisToPosix 0 }
      , regionFilter = Dict.fromList [ ( "大砂漠", True ), ( "水月平原", True ), ( "白青山脈", True ) ]
      , forceFilter = Dict.fromList [ ( "勢力ボス", True ), ( "非勢力ボス", True ) ]
      , cycles = Ok []
      , error = Nothing
      , editTarget = Nothing
      , defeatedTimeInputValue = ""
      }
    , Cmd.batch
        [ Task.perform GetZone Time.here
        , Ports.requestLoadCycles <| pageToServer page
        ]
    )


pageToServer : Page -> String
pageToServer page =
    case page of
        CyclePage s ->
            s


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
        , Ports.receiveUpdate ReceiveUpdate
        ]


defaultServer =
    "ケヤキ"


parseUrl : Url -> Page
parseUrl =
    Maybe.withDefault (CyclePage defaultServer)
        << Url.Parser.parse
            (Url.Parser.oneOf
                [ Url.Parser.map (CyclePage defaultServer) <| Url.Parser.s "index.html"
                , Url.Parser.map CyclePage <| Url.Parser.custom "Multi byte parser" Url.percentDecode
                ]
            )


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
            let
                now =
                    model.now
            in
            ( { model | now = { now | zone = zone } }, Task.perform GetNowFirst Time.now )

        GetNowFirst time ->
            let
                now =
                    model.now
            in
            ( { model | now = { now | time = time } }
            , Random.generate GetRandomTimes <|
                randomTimesGenerator model.now <|
                    List.length <|
                        Result.withDefault [] model.cycles
            )

        GetNow time ->
            let
                now =
                    model.now
            in
            ( { model | now = { now | time = time } }
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
            let
                val =
                    boss.lastDefeatedTime
            in
            ( { model
                | editTarget = Just boss
                , defeatedTimeInputValue = Times.hourMinute { zone = model.now.zone, time = val }
              }
            , Cmd.none
            )

        ChangeDefeatedTimeInputValue s ->
            ( { model
                | defeatedTimeInputValue = s
              }
            , Cmd.none
            )

        NowDefeated ->
            ( { model | defeatedTimeInputValue = Times.hourMinute model.now }
            , Cmd.none
            )

        ChangeRemainMinutes boss s ->
            case String.toInt s of
                Nothing ->
                    ( model, Cmd.none )

                Just i ->
                    if i <= 0 then
                        ( model, Cmd.none )

                    else
                        let
                            repopTime =
                                Times.addMinute i model.now

                            ldt =
                                Times.addMinute (negate boss.repopIntervalMinutes) repopTime
                        in
                        ( { model | defeatedTimeInputValue = Times.hourMinute ldt }
                        , Cmd.none
                        )

        CancelEdit ->
            ( { model | editTarget = Nothing }, Cmd.none )

        SaveEdit ->
            case model.editTarget of
                Nothing ->
                    ( model, Cmd.none )

                Just boss ->
                    case Times.hourMinuteToPosix model.now model.defeatedTimeInputValue of
                        Nothing ->
                            ( model, Cmd.none )

                        Just t ->
                            ( { model
                                | editTarget = Nothing
                                , cycles =
                                    Result.map
                                        (\list ->
                                            List.Extra.setIf (\elm -> elm.id == boss.id) { boss | lastDefeatedTime = t } list
                                        )
                                        model.cycles
                              }
                            , Ports.requestUpdateDefeatedTime
                                { server = pageToServer model.page
                                , bossIdAtServer = boss.serverId
                                , time = Types.posixToTimestamp t
                                }
                            )

        ReceiveUpdate v ->
            case Json.Decode.decodeValue Types.fieldBossCycleDecoder v of
                Err e ->
                    ( { model | error = Just e }, Cmd.none )

                Ok updated ->
                    ( { model
                        | cycles =
                            Result.map
                                (\list ->
                                    List.Extra.setIf (\elm -> elm.id == updated.id) updated list
                                )
                                model.cycles
                      }
                    , Cmd.none
                    )


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
                            Types.nextPopTime boss model.now.time
                    in
                    Time.posixToMillis nextTime.time
                )
            <|
                getFilteredCycles model

        title =
            "Field boss cycle | Blade and Soul Revolution"

        body =
            [ header []
                [ h5 [] [ text title ]
                , h1 [] [ text "" ]
                , p [] [ text <| "サーバ: " ++ pageToServer model.page ]
                ]
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
                        , td [ class "label-now" ] [ text <| "現在時刻: " ++ Times.omitSecond model.now ]
                        , td [ class "label-now" ] [ text <| Times.omitSecond <| Times.addHour 1 model.now ]
                        ]
                    ]
                , tbody [] <| List.map (viewBossTimeline model.now) ordered
                ]
            , footer []
                [ h5 [] [ text "Powered by Haskell at ケヤキ server" ]
                , p [] [ text <| Maybe.withDefault "" <| Maybe.map Json.Decode.errorToString model.error ]
                ]
            ]
    in
    { title = title
    , body =
        case model.editTarget of
            Nothing ->
                body

            Just _ ->
                [ div [ class "container-body-and-backdrop" ] <| body ++ [ div [ class "backdrop", onClick CancelEdit ] [] ] ] ++ viewEditor model
    }


viewEditor : Model -> List (Html Msg)
viewEditor model =
    case model.editTarget of
        Nothing ->
            []

        Just boss ->
            [ div [ class "editor" ]
                [ p [ class "description" ] [ text "討伐時刻の報告へのご協力ありがとうございます。正確な時刻が分からない場合はだいたいのところで構いませーん。" ]
                , ul []
                    [ li [] [ span [ class "label-boss-name", style "color" (colorForRegion boss.region) ] [ text boss.name ] ]
                    , li [] [ fbIcon boss ]
                    , li [ class "label-repop-time" ] [ text <| "再登場時間: " ++ String.fromInt boss.repopIntervalMinutes ++ "分" ]
                    ]
                , div [ class "form-group" ]
                    [ label [] [ text "討伐時刻で報告" ]
                    , input
                        [ type_ "time"
                        , class "form-control"
                        , class <| inputErrorClass model.defeatedTimeInputValue
                        , value model.defeatedTimeInputValue
                        , onInput ChangeDefeatedTimeInputValue
                        ]
                        []
                    , button [ class "btn btn-sm btn-success", onClick NowDefeated ] [ text "たった今討伐" ]
                    ]
                , div [ class "form-group" ]
                    [ label [] [ text "残り時間で報告" ]
                    , input [ type_ "number", class "form-control", onInput <| ChangeRemainMinutes boss ] []
                    ]
                , div [ class "form-group" ]
                    [ label []
                        [ text <|
                            "出現予定時刻: "
                                ++ (Maybe.withDefault "" <|
                                        Maybe.map Times.omitSecond <|
                                            Maybe.map (Times.addMinute boss.repopIntervalMinutes) <|
                                                Maybe.map (\t -> { zone = model.now.zone, time = t }) <|
                                                    Times.hourMinuteToPosix model.now model.defeatedTimeInputValue
                                   )
                        ]
                    ]
                , div [ class "btn-group" ]
                    [ button [ class "btn btn-sm btn-light", onClick CancelEdit ] [ text "キャンセル" ]
                    , button [ class "btn btn-sm btn-primary", onClick SaveEdit ] [ text "保存" ]
                    ]
                ]
            ]


inputErrorClass : String -> String
inputErrorClass s =
    if Times.isValidHourMinute s then
        ""

    else
        "has-error"


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


viewBossTimeline : ZonedTime -> FieldBossCycle -> Html Msg
viewBossTimeline now boss =
    let
        nextPopTime =
            Types.nextPopTime boss now.time

        ldt =
            Times.omitSecond { now | time = boss.lastDefeatedTime }

        npt =
            Times.omitSecond { now | time = nextPopTime.time }

        repop =
            Types.nextPopTime boss now.time
    in
    tr [ onClick <| StartEdit boss ]
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
                    [ span [ class "label-time" ] [ text <| "討伐時刻: " ++ ldt ]
                    , span [ class "fas fa-edit" ] []
                    ]
                , li [ class "label-time" ] [ text <| "登場時刻: " ++ npt ]
                ]
            ]
        , td [ class "time" ]
            [ span [ class "time-bar", class <| timeBarColorClass repop.remainSeconds, style "width" <| timeBarWidth repop now.time ]
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
