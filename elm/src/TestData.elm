module TestData exposing (..)

import Time
import Types exposing (FieldBossCycle)


testData : List FieldBossCycle
testData =
    List.indexedMap (\idx boss -> { boss | sortOrder = idx * 10 })
        [ { name = "金剛力士"
          , id = "kongou_rikishi"
          , region = "大砂漠"
          , area = "トムンジン"
          , force = False
          , sortOrder = 30
          , repopIntervalMinutes = 60
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "鬼炎ハサミ虫"
          , id = "kien_hasami_mushi"
          , region = "大砂漠"
          , area = "炎天の大地"
          , force = False
          , sortOrder = 30
          , repopIntervalMinutes = 60
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "黒唱族族長"
          , id = "kokusyouzoku_zokuchou"
          , region = "大砂漠"
          , area = "ザジ岩峰"
          , force = False
          , sortOrder = 30
          , repopIntervalMinutes = 60
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "ヤゴルタ"
          , id = "yagoruta"
          , region = "大砂漠"
          , area = "五色岩都"
          , force = True
          , sortOrder = 30
          , repopIntervalMinutes = 60
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "黒獣神"
          , id = "kokujuushin"
          , area = "狼の丘陵"
          , region = "水月平原"
          , force = False
          , sortOrder = 0
          , repopIntervalMinutes = 120
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "ボルコロッソ野蛮戦士"
          , id = "borukorosso"
          , area = "養豚場"
          , region = "水月平原"
          , force = False
          , sortOrder = 10
          , repopIntervalMinutes = 120
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "ゴルラク軍訓練教官"
          , id = "goruraku"
          , area = "半月湖"
          , region = "水月平原"
          , force = False
          , sortOrder = 20
          , repopIntervalMinutes = 120
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "鬼蛮"
          , id = "kiban"
          , area = "霧霞の森"
          , region = "水月平原"
          , force = False
          , sortOrder = 30
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "陰玄儡"
          , id = "ingenrai"
          , area = "悪鬼都市"
          , region = "水月平原"
          , force = True
          , sortOrder = 40
          , repopIntervalMinutes = 120
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "捕食者ブタン"
          , id = "butan"
          , region = "白青山脈"
          , area = "風の平野"
          , force = False
          , sortOrder = 50
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "鋭いキバ"
          , id = "surudoi_kiba"
          , region = "白青山脈"
          , area = "赤い朝焼けの盆地"
          , force = False
          , sortOrder = 60
          , repopIntervalMinutes = 240
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "戦斧族頭目チャチャ"
          , id = "chacha"
          , region = "白青山脈"
          , area = "白樺の森"
          , force = False
          , sortOrder = 70
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "シンブウ"
          , id = "sinbuu"
          , region = "白青山脈"
          , area = "ハンターの安息地"
          , force = False
          , sortOrder = 80
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "木こり副族長ウタ"
          , id = "uta"
          , region = "白青山脈"
          , area = "北方雪原"
          , force = False
          , sortOrder = 90
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        , { name = "兎仮面族フィク・コウ"
          , id = "fiku_kou"
          , region = "白青山脈"
          , area = "岩の丘陵"
          , force = True
          , sortOrder = 100
          , repopIntervalMinutes = 180
          , lastDefeatedTime = Time.millisToPosix 0
          }
        ]
