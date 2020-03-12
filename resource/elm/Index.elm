module Index exposing (..)

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


type alias Model =
    { key : Key
    , page : Page
    , zone : Zone
    , now : Posix
    , regionFilter : Dict Region Bool
    , forceFilter : Dict String Bool
    , sortPolicy : SortPolicy
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
    | ToggleRegionFilter Region
    | ToggleForceFilter String
    | ReceiveCycles Value
    | ChangeSortPolicy SortPolicy
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
      , zone = Time.utc
      , now = Time.millisToPosix 0
      , regionFilter = Dict.fromList [ ( "大砂漠", True ), ( "水月平原", True ), ( "白青山脈", True ) ]
      , forceFilter = Dict.fromList [ ( "勢力ボス", True ), ( "非勢力ボス", True ) ]
      , sortPolicy = NextPopTimeOrder
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
            ( { model | zone = zone }, Task.perform GetNowFirst Time.now )

        GetNowFirst time ->
            ( { model | now = time }, Cmd.none )

        GetNow time ->
            let
                now =
                    model.now
            in
            ( { model | now = time }, Cmd.none )

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

        ChangeSortPolicy policy ->
            ( { model | sortPolicy = policy }, Cmd.none )

        StartEdit boss ->
            let
                val =
                    boss.lastDefeatedTime
            in
            ( { model
                | editTarget = Just boss
                , defeatedTimeInputValue = Times.hourMinute { zone = model.zone, time = val }
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
            ( { model | defeatedTimeInputValue = Times.hourMinute <| zonedNow model }
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
                                Times.addMinute i <| zonedNow model

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
                    case Times.hourMinuteToPosix (zonedNow model) model.defeatedTimeInputValue of
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


zonedNow : Model -> ZonedTime
zonedNow model =
    { zone = model.zone, time = model.now }


bossComparator : Zone -> Posix -> SortPolicy -> FieldBossCycle -> Int
bossComparator zone now policy =
    case policy of
        NaturalOrder ->
            .sortOrder

        NextPopTimeOrder ->
            \boss ->
                let
                    nextTime =
                        Types.nextPopTime boss now
                in
                -- 前回討伐が5分以内のボスは画面上部に残す. この方が報告しやすい.
                if Time.Extra.diff Minute zone nextTime.preTime now < 5 then
                    Time.posixToMillis nextTime.preTime

                else
                    Time.posixToMillis nextTime.time


view : Model -> Document Msg
view model =
    let
        ordered =
            List.sortBy (bossComparator model.zone model.now model.sortPolicy) <|
                getFilteredCycles model

        title =
            "HASTOOL | Blade and Soul Revolution Field boss cycle tracker"

        body =
            [ header []
                [ div [ class "title" ]
                    [ h1 [] [ text "HASTOOL" ]
                    , h2 [] [ text "Blade and Soul Revolution Field Boss Tracker" ]
                    ]
                ]
            , div [] [ text <| "サーバ: " ++ pageToServer model.page ]
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
            , div [ class "filter-container" ]
                [ ul [ class "filter region" ]
                    [ li [] [ checkbox "普通に並べる" (model.sortPolicy == NaturalOrder) (ChangeSortPolicy NaturalOrder) ]
                    , li [] [ checkbox "登場順に並べる" (model.sortPolicy /= NaturalOrder) (ChangeSortPolicy NextPopTimeOrder) ]
                    ]
                ]
            , table [ class "main-contents" ]
                [ thead []
                    [ tr []
                        [ td [] []
                        , td [ class "label-now" ] [ text <| "現在時刻: " ++ (Times.omitSecond <| zonedNow model) ]
                        , td [ class "label-now" ] [ text <| Times.omitSecond <| Times.addHour 1 <| zonedNow model ]
                        ]
                    ]
                , tbody [] <| List.map (viewBossTimeline <| zonedNow model) ordered
                ]
            , footer []
                [ h5 [] [ text "Powered by Haskell at ケヤキ server" ]
                , p [ class "description" ] [ text "ご要望・ご意見はささ下さい" ]
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
                [ p [ class "description" ] [ text "討伐時刻の報告へのご協力ありがとうございます。時刻はだいたいで構いません。なお報告は、この画面を見ている他の方にも反映されます。" ]
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
                                                Maybe.map (\t -> { zone = model.zone, time = t }) <|
                                                    Times.hourMinuteToPosix (zonedNow model) model.defeatedTimeInputValue
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
    tr []
        [ td [ class "boss-info", onClick <| StartEdit boss ]
            [ ul []
                [ li [] [ span [ class "label-boss-name", style "color" (colorForRegion boss.region) ] [ text boss.name ] ]
                , li [] [ fbIcon boss ]
                , li [ class "label-repop-time" ] [ text <| "再登場時間: " ++ String.fromInt boss.repopIntervalMinutes ++ "分" ]
                ]
            ]
        , td [ class "repop-info", onClick <| StartEdit boss ]
            [ ul
                []
                [ li [ class "label-region-and-area" ] [ text boss.region ]
                , li [ class "label-region-and-area" ] [ text boss.area ]
                , li []
                    [ span [ class "label-time" ] [ text <| "討伐報告: " ++ ldt ]
                    , span [ class "fas fa-edit" ] []
                    ]
                , li [ class "label-time" ] [ text <| "前回討伐: " ++ Times.omitSecond { now | time = nextPopTime.preTime } ]
                , li [ class "label-time" ] [ text <| "登場予想: " ++ npt ]
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
