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

async function setupServer(server: string) {
    const bossList = await listCycles(server);
    if (bossList.length > 0) {
        return;
    }
    const root = buildCollection(server);
    await Promise.all(getBossCycleList().map(boss => {
        const o = Object.assign(boss, {}, { lastDefeatedTime: new Date(boss.lastDefeatedTime.seconds * 1000) });
        return root.add(o);
    }));
}

async function listCycles(server: string): Promise<FieldBossCycle[]> {
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

setupServer("テスト")
    .then(console.log)
    .catch(console.log)
    ;


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
          sortOrder: 180
        }
      ];
}