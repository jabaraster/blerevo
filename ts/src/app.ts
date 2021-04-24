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
    return [
      {region: 'グルーディオ地方', name: 'クイーンアント', area: 'アリの巣地下3階', repopIntervalMinutes: 360, id: 'queen_ant', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'グルーディオ地方', name: 'サヴァン', area: 'アリの巣地下2階', repopIntervalMinutes: 720, id: 'savan', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'グルーディオ地方', name: 'バシラ', area: '荒地南部', repopIntervalMinutes: 600, id: 'bashira', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'グルーディオ地方', name: 'チェルトゥバ', area: 'チェルトゥバのキャンプ', repopIntervalMinutes: 360, id: 'cheruthuba', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'コアサセプタ', area: 'クルマの塔7階', repopIntervalMinutes: 600, id: 'koa_saseputa', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'カタン', area: 'クルマの塔6階', repopIntervalMinutes: 600, id: 'katan', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: '汚染したクルマ', area: 'クルマの塔3階', repopIntervalMinutes: 480, id: 'osen_shita_kuruma', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'テンペスト', area: '死体処理場', repopIntervalMinutes: 360, id: 'tempest', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'スタン', area: '巨人の痕跡', repopIntervalMinutes: 420, id: 'stan', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'ミュータントクルマ', area: 'クルマ湿地', repopIntervalMinutes: 480, id: 'mutant_kuruma', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'サルカ', area: 'デルーリザードマン生息地', repopIntervalMinutes: 600, id: 'saruka', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'ティミトリス', area: 'フローラン開拓地', repopIntervalMinutes: 480, id: 'timitris', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'バンドライト', area: 'ディオン丘陵地帯', repopIntervalMinutes: 720, id: 'bandright', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'タラキン', area: '反乱軍アジト', repopIntervalMinutes: 600, id: 'tarakin', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'フェリス', area: 'ビーハイヴ', repopIntervalMinutes: 180, id: 'feris', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ディオン地方', name: 'エンクラ', area: 'ディオン牧草地', repopIntervalMinutes: 360, id: 'enchra', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'ベヒモス', area: 'ドラゴンバレー北部', repopIntervalMinutes: 540, id: 'behemoth', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'ブラックリリー', area: '死の回廊', repopIntervalMinutes: 720, id: 'balck_riry', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'メデューサ', area: 'メデューサの庭園', repopIntervalMinutes: 600, id: 'medousa', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'バンナロード', area: 'ゴルコンの花園', repopIntervalMinutes: 300, id: 'bannaroad', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'ブレカ', area: 'ブレカ巣窟', repopIntervalMinutes: 360, id: 'bureka', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
      {region: 'ギラン地方', name: 'マトゥラ', area: '略奪者の野営地', repopIntervalMinutes: 360, id: 'mathura', reliability: false, sortOrder: 0, lastDefeatedTime: { seconds: 1584531960 },},
    ]
}