import * as Firebase from "firebase";

const COLLECTION_ID = "field-boss-cycle";

interface Timestamp {
    seconds: number;
}

interface FieldBossCycle {
    name: string;
    id: string;
    area: string;
    region: string;
    reliability: boolean;
    lastDefeatedTime: Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
}

Firebase.initializeApp({
    projectId: "hastool-lineage",
});
const firestore = Firebase.firestore();
const dataRoot = firestore.collection(COLLECTION_ID);

function buildCollection(server: string): Firebase.firestore.CollectionReference<Firebase.firestore.DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/cycles/`);
}

export async function setupServer(server: string) {
    const bossList = await listCycles(server);
//    if (bossList.length > 0) {
//        return;
//    }
    const bossListMap = bossList.reduce((accum, boss) => {
      accum.set(boss.id, boss);
      return accum;
    }, new Map<string, FieldBossCycle>());
    const root = buildCollection(server);
    await Promise.all(getBossCycleList().map((boss, idx) => {
        if (bossListMap.has(boss.id)) {
            return;
        }
        console.log(`フィルボ ${boss.name} の情報を登録します。`);
        const o = Object.assign(boss, {}, {
          lastDefeatedTime: new Date(boss.lastDefeatedTime.seconds * 1000),
          sortOrder: idx + 10,
        });
        return root.add(o);
    }));
}

export async function listCycles(server: string): Promise<FieldBossCycle[]> {
    const ret: any[] = [];
    await buildCollection(server)
    .orderBy("sortOrder", "asc")
    .get()
    .then(d => {
        d.forEach(r => {
            ret.push(r.data());
        });
    })
    return ret;
}

function getBossCycleList(): FieldBossCycle[] {
    const src = [
      ['グルーディオ地方','クイーンアント','アリの巣地下3階',360,'queen_ant'],
      ['グルーディオ地方','サヴァン','アリの巣地下2階',720,'savan'],
      ['グルーディオ地方','バシラ','荒地南部',600,'bashira'],
      ['グルーディオ地方','チェルトゥバ','チェルトゥバのキャンプ',360,'cheruthuba'],
      ['ディオン地方','コアサセプタ','クルマの塔7階',600,'koa_saseputa'],
      ['ディオン地方','カタン','クルマの塔6階',600,'katan'],
      ['ディオン地方','汚染したクルマ','クルマの塔3階',480,'osen_shita_kuruma'],
      ['ディオン地方','テンペスト','死体処理場',360,'tempest'],
      ['ディオン地方','スタン','巨人の痕跡',420,'stan'],
      ['ディオン地方','ミュータントクルマ','クルマ湿地',480,'mutant_kuruma'],
      ['ディオン地方','サルカ','デルーリザードマン生息地',600,'saruka'],
      ['ディオン地方','ティミトリス','フローラン開拓地',480,'timitris'],
      ['ディオン地方','バンドライト','ディオン丘陵地帯',720,'bandright'],
      ['ディオン地方','タラキン','反乱軍アジト',600,'tarakin'],
      ['ディオン地方','フェリス','ビーハイヴ',180,'feris'],
      ['ディオン地方','エンクラ','ディオン牧草地',360,'enchra'],
      ['ギラン地方','ベヒモス','ドラゴンバレー北部',540,'behemoth'],
      ['ギラン地方','ブラックリリー','死の回廊',720,'balck_riry'],
      ['ギラン地方','メデューサ','メデューサの庭園',600,'medousa'],
      ['ギラン地方','バンナロード','ゴルコンの花園',300,'bannaroad'],
      ['ギラン地方','ブレカ','ブレカ巣窟',360,'bureka'],
      ['ギラン地方','マトゥラ','略奪者の野営地',360,'mathura'],
    ]
    return src.map((ary) => {
      name: ary[1],
      id: ary[4],
      area: ary[2],
      region: ary[0],
      reliability: false,
      lastDefeatedTime: Timestamp
      repopIntervalMinutes: number;
      sortOrder: number;
    })
}