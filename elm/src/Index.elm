module Index exposing (..)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav exposing (Key)
import Html exposing (..)
import Html.Attributes exposing (..)
import Task
import TestData
import Time exposing (Posix, Zone)
import Times
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
    , cycles : List FieldBossCycle
    }


type Msg
    = LinkClicked Browser.UrlRequest
    | UrlChanged Url
    | GetZone Zone
    | GetTime Posix


init : () -> Url -> Key -> ( Model, Cmd Msg )
init _ url key =
    ( { key = key
      , page = parseUrl url
      , cycles = TestData.testData
      , zone = Time.utc
      , now = Time.millisToPosix 0
      }
    , Task.perform GetZone Time.here
    )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch [ Time.every 1000 GetTime ]


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

        GetTime time ->
            ( { model | now = time }, Cmd.none )

        GetZone zone ->
            ( { model | zone = zone }, Cmd.none )


view : Model -> Document Msg
view model =
    let
        ordered =
            List.sortBy (\boss -> Time.posixToMillis boss.lastDefeatedTime) model.cycles
    in
    { title = "Field boss cycle | Blade and Soul Revolution"
    , body =
        [ h1 [] [ text "Blade and Soul Revolution" ]
        , ol [ style "color" "#333333" ] <| List.map (viewBossTimeline model.zone model.now) ordered
        ]
    }


viewBossTimeline : Zone -> Posix -> FieldBossCycle -> Html msg
viewBossTimeline zone now boss =
    let
        nextPopTime =
            Types.nextPopTime boss now
    in
    li []
        [ h2 [ style "color" (colorForRegion boss.region) ] [ text boss.name ]
        , h3 [] [ text <| Times.omitSecond { zone = zone, time = nextPopTime.time } ]
        ]


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
