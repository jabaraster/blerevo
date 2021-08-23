import * as Firebase from "firebase";

const COLLECTION_ID = "field-boss-cycle-2";

interface Timestamp {
    seconds: number;
}

interface FieldBossCycle {
    name: string;
    id: string;
    region: string;
    area: string;
    force: boolean,
    reliability: boolean;
    lastDefeatedTime: Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
}

Firebase.initializeApp({
    projectId: "blade-and-soul-field-bos-c21bf",
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
    await Promise.all(getBossCycleList().map(boss => {
        if (bossListMap.has(boss.id)) {
            return;
        }
        console.log(`フィルボ ${boss.name} の情報を登録します。`);
        const o = Object.assign(boss, {}, { lastDefeatedTime: new Date(boss.lastDefeatedTime.seconds * 1000) });
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
        {
          area: 'トムンジン',
          force: false,
          id: 'kongou_rikishi',
          lastDefeatedTime: { seconds: 1584521580 },
          name: '金剛力士',
          region: '大砂漠',
          repopIntervalMinutes: 60,
          reliability: false,
          sortOrder: 0
        },
        {
          area: '炎天の大地',
          force: false,
          id: 'kien_hasami_mushi',
          lastDefeatedTime: { seconds: 1584679020 },
          name: '鬼炎ハサミ虫',
          region: '大砂漠',
          repopIntervalMinutes: 60,
          reliability: false,
          sortOrder: 10
        },
        {
          area: 'ザジ岩峰',
          force: false,
          id: 'kokusyouzoku_zokuchou',
          lastDefeatedTime: { seconds: 1584531960 },
          name: '黒唱族族長',
          region: '大砂漠',
          repopIntervalMinutes: 60,
          reliability: false,
          sortOrder: 20
        },
        {
          area: '五色岩都',
          force: true,
          id: 'yagoruta',
          lastDefeatedTime: { seconds: 1583985900 },
          name: 'ヤゴルタ',
          region: '大砂漠',
          repopIntervalMinutes: 60,
          reliability: false,
          sortOrder: 30
        },
        {
          area: '狼の丘陵',
          force: false,
          id: 'kokujuushin',
          lastDefeatedTime: { seconds: 1584672900 },
          name: '黒獣神',
          region: '水月平原',
          repopIntervalMinutes: 120,
          reliability: false,
          sortOrder: 40
        },
        {
          area: '養豚場',
          force: false,
          id: 'porukorosso',
          lastDefeatedTime: { seconds: 1584663840 },
          name: 'ポルコロッソ族野蛮戦士',
          region: '水月平原',
          repopIntervalMinutes: 120,
          reliability: false,
          sortOrder: 50
        },
        {
          area: '半月湖',
          force: false,
          id: 'goruraku',
          lastDefeatedTime: { seconds: 1584679260 },
          name: 'ゴルラク軍訓練教官',
          region: '水月平原',
          repopIntervalMinutes: 120,
          reliability: false,
          sortOrder: 60
        },
        {
          area: '霧霞の森',
          force: false,
          id: 'kiban',
          lastDefeatedTime: { seconds: 1584679560 },
          name: '鬼蛮',
          region: '水月平原',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 70
        },
        {
          area: '悪鬼都市',
          force: true,
          id: 'ingenrai',
          lastDefeatedTime: { seconds: 1584617580 },
          name: '陰玄儡',
          region: '水月平原',
          repopIntervalMinutes: 120,
          reliability: false,
          sortOrder: 80
        },
        {
          area: '風の平野',
          force: false,
          id: 'butan',
          lastDefeatedTime: { seconds: 1584618840 },
          name: '捕食者ブタン',
          region: '白青山脈',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 90
        },
        {
          area: '赤い朝焼けの盆地',
          force: false,
          id: 'surudoi_kiba',
          lastDefeatedTime: { seconds: 1584625200 },
          name: '鋭いキバ',
          region: '白青山脈',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 100
        },
        {
          area: '白樺の森',
          force: false,
          id: 'chacha',
          lastDefeatedTime: { seconds: 1584586140 },
          name: '戦斧族頭目チャチャ',
          region: '白青山脈',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 110
        },
        {
          area: 'ハンターの安息地',
          force: false,
          id: 'sinbuu',
          lastDefeatedTime: { seconds: 1584662040 },
          name: 'シンブウ',
          region: '白青山脈',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 120
        },
        {
          area: '北方雪原',
          force: false,
          id: 'uta',
          lastDefeatedTime: { seconds: 1584658680 },
          name: '木こり副族長ウタ',
          region: '白青山脈',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 130
        },
        {
          area: '岩の丘陵',
          force: true,
          id: 'fiku_kou',
          lastDefeatedTime: { seconds: 1583923440 },
          name: '兎仮面族フィク・コウ',
          region: '白青山脈',
          repopIntervalMinutes: 180,
          reliability: false,
          sortOrder: 140
        },
        {
          area: '忘却の渓谷',
          force: false,
          id: 'boukyaku_no_keikoku',
          lastDefeatedTime: { seconds: 1584653040 },
          name: '忘却の渓谷FB',
          region: '入れ替わるFB',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 150
        },
        {
          area: '怨恨の廃墟',
          force: true,
          id: 'onkon_no_haikyo',
          lastDefeatedTime: { seconds: 1584320400 },
          name: '怨恨の廃墟FB',
          region: '入れ替わるFB',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 160
        },
        {
          area: '忘却の迷宮',
          force: false,
          id: 'boukyaku_no_meikyuu',
          lastDefeatedTime: { seconds: 1584618660 },
          name: '忘却の迷宮FB',
          region: '入れ替わるFB',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 170
        },
        {
          area: '黄昏の迷宮',
          force: false,
          id: 'tasogare_no_meikyuu',
          lastDefeatedTime: { seconds: 1584628980 },
          name: '黄昏の迷宮FB',
          region: '入れ替わるFB',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 180
        },
        {
          area: '捨てられた法機の渓谷',
          force: false,
          id: 'yussi-dofun',
          lastDefeatedTime: { seconds: 1584628980 },
          name: '守護隊長ユッシ・ドウファン',
          region: '白青山脈',
          repopIntervalMinutes: 240,
          reliability: false,
          sortOrder: 190
        },
        {
           area: '捨てられた法機の渓谷',
           force: true,
           id: 'wohyo',
           lastDefeatedTime: { seconds: 1600131000 },
           name: '守護隊長ウォーヒョ',
           region: '白青山脈',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 200
         },
         {
           area: '灰色の谷',
           force: false,
           id: 'yougan_hasamimushi',
           lastDefeatedTime: { seconds: 1600997640 },
           name: '溶岩ハサミ虫',
           region: '月下渓谷(青)',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 210
         },
         {
           area: '暗闇の谷',
           force: false,
           id: 'yougan_sasori',
           lastDefeatedTime: { seconds: 1599301020 },
           name: '溶岩サソリ',
           region: '月下渓谷(赤)',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 220
         },
         {
           area: '古い鉱山',
           force: false,
           id: 'hakon',
           lastDefeatedTime: { seconds: 1600236000 },
           name: '破滅法機破魂',
           region: '月下渓谷(青)',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 230
         },
         {
           area: '棄てられた鉱山',
           force: false,
           id: 'harei',
           lastDefeatedTime: { seconds: 1599335520 },
           name: '破滅法機破霊',
           region: '月下渓谷(赤)',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 240
         },
         {
           area: '霊石渓谷',
           force: true,
           id: 'charo_eeru',
           lastDefeatedTime: { seconds: 1597120200 },
           name: '戦闘隊長チャロ・エール',
           region: '月下渓谷',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 250
         },
         {
           area: '霊石渓谷',
           force: true,
           id: 'koro_saigetsu',
           lastDefeatedTime: { seconds: 1599258780 },
           name: '戦闘隊長コロ・サイゲツ',
           region: '月下渓谷',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 260
         },
         {
           area: '凍土の丘',
           force: false,
           id: 'kuuhuku',
           lastDefeatedTime: { seconds: 1599258780 },
           name: '破戒僧クウフク',
           region: '悲劇の高原',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 270
         },
         {
           area: '慰皇城',
           force: false,
           id: 'yukionna',
           lastDefeatedTime: { seconds: 1599258780 },
           name: '雪女',
           region: '悲劇の高原',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 280
         },
         {
           area: '慰皇要塞',
           force: true,
           id: 'fin_zauru',
           lastDefeatedTime: { seconds: 1599258780 },
           name: '奇襲隊長フィン・ザウル',
           region: '悲劇の高原',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 290
         },
         {
           area: '慰皇要塞',
           force: true,
           id: 'dowol',
           lastDefeatedTime: { seconds: 1599258780 },
           name: '奇襲隊長ドウォル',
           region: '悲劇の高原',
           reliability: false,
           repopIntervalMinutes: 240,
           sortOrder: 300
         },
      ];
}