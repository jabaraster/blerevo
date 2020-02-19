module Index exposing (..)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav exposing (Key)
import Dict exposing (Dict)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import List.Extra
import Random exposing (Generator)
import Task
import TestData
import Time exposing (Posix, Zone)
import Time.Extra exposing (Interval(..))
import Times exposing (ZonedTime)
import Types exposing (..)
import Url exposing (Url)


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
    , cycles : List FieldBossCycle
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


init : () -> Url -> Key -> ( Model, Cmd Msg )
init _ url key =
    let
        cycles =
            TestData.testData
    in
    ( { key = key
      , page = parseUrl url
      , zone = Time.utc
      , now = Time.millisToPosix 0
      , regionFilter = Dict.fromList [ ( "大砂漠", False ), ( "水月平原", True ), ( "白青山脈", True ) ]
      , forceFilter = Dict.fromList [ ( "勢力ボス", False ), ( "非勢力ボス", True ) ]
      , cycles = cycles
      }
    , Task.perform GetZone Time.here
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
    Sub.batch [ Time.every 1000 GetNow ]


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
                    List.length model.cycles
            )

        GetNow time ->
            ( { model | now = time }
            , Cmd.none
            )

        GetRandomTimes times ->
            ( { model | cycles = setDefeatedTime times model.cycles }, Cmd.none )

        ToggleRegionFilter region ->
            ( { model
                | regionFilter =
                    Debug.log "" <|
                        Dict.update region
                            (\mv -> Maybe.map not mv |> Maybe.withDefault True |> Just)
                            model.regionFilter
              }
            , Cmd.none
            )

        ToggleForceFilter f ->
            ( { model
                | forceFilter =
                    Debug.log "" <|
                        Dict.update f
                            (\mv -> Maybe.map not mv |> Maybe.withDefault True |> Just)
                            model.forceFilter
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
        model.cycles


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
    in
    { title = "Field boss cycle | Blade and Soul Revolution"
    , body =
        [ h1 [] [ text "Blade and Soul Revolution" ]
        , div [ class "filter-container" ]
            [ h4 [ class "filter-header" ] [ text "地方" ]
            , ul [ class "filter region" ]
                [ li [] [ filterText "大砂漠" model.regionFilter ToggleRegionFilter ]
                , li [] [ filterText "水月平原" model.regionFilter ToggleRegionFilter ]
                , li [] [ filterText "白青山脈" model.regionFilter ToggleRegionFilter ]
                ]
            ]
        , div [ class "filter-container" ]
            [ h4 [ class "filter-header" ] [ text "勢力" ]
            , ul [ class "filter region" ]
                [ li [] [ filterText "勢力ボス" model.forceFilter ToggleForceFilter ]
                , li [] [ filterText "非勢力ボス" model.forceFilter ToggleForceFilter ]
                ]
            ]
        , div []
            [ div [ class "circles-container" ]
                [ circle "1h"
                , circle "2h"
                , circle "3h"
                , fbIcon "kongou_rikishi"
                ]
            ]
        , ol [ style "color" "#333333" ] <| List.map (viewBossTimeline model.zone model.now) ordered
        ]
    }


filterText : String -> Dict String Bool -> (String -> msg) -> Html msg
filterText key dict action =
    let
        v =
            Dict.get key dict

        c =
            Maybe.withDefault True <| Dict.get key dict
    in
    label []
        [ input [ type_ "checkbox", checked c, onClick <| action key ] []
        , text key
        ]


circle : String -> Html msg
circle th =
    div [ class <| "circle-" ++ th ++ "-container" ] [ div [ class <| "circle-" ++ th ] [] ]


viewBossTimeline : Zone -> Posix -> FieldBossCycle -> Html msg
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
    li []
        [ h2 []
            [ forceLabel boss
            , fbIcon boss.id
            , span [ style "color" (colorForRegion boss.region) ] [ text boss.name ]
            ]
        , h3 [] [ text <| "最後の討伐時刻: " ++ ldt ]
        , h3 [] [ text <| "次のリポップ時刻: " ++ npt ]
        , h3 [] [ text <| "リポップまで: " ++ String.fromInt repop.remainMinutes ++ "分" ]
        ]


fbIcon : String -> Html msg
fbIcon bossId =
    span [ class "fb-icon-container" ]
        [ span [ class <| "fb-icon-" ++ bossId ] []
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
            "#deb887"

        "水月平原" ->
            "#000080"

        "白青山脈" ->
            "#696969"

        _ ->
            "#000000"
