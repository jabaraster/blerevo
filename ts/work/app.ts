import * as Firebase from "firebase";

const COLLECTION_ID = "field-boss-cycle-2";

Firebase.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
});
const firestore = Firebase.firestore();
const dataRoot = firestore.collection(COLLECTION_ID);

async function listCycles(server: string): Promise<any[]> {
    const ret: any[] = [];
    await firestore.collection(`${COLLECTION_ID}/${server}/cycles/`)
    .orderBy("sortOrder", "asc")
    .get()
    .then(d => {
        d.forEach(r => {
            ret.push(r.data());
        });
    })
    return ret;
}

async function initializeCycles(server: string) {
    await firestore.runTransaction(async _ => {
        await dataRoot.doc(server).set({})
        .catch((err) => {
            console.log(err);
        });
        const cyclesCollection = firestore.collection(`field-boss-cycle-2/${server}/cycles/`);
        const d = new Date();
        await Promise.all(createMasterData().map(async (boss, idx) => {
            console.log(boss.name);
            await cyclesCollection.add(Object.assign({}, boss, {
                sortOrder: idx * 10,
                channel: 1,
                lastDefeatedTime: d,
            }));
        }));
    });
}


async function main() {
    //await initializeCycles("ケヤキ");
    (await listCycles("ケヤキ"))
        .forEach(console.log);
}

main();

interface FieldBossMeta {
    name: string,
    region: string,
    area: string,
    force: boolean,
    repopIntervalMinutes: number,
}

function createMasterData(): FieldBossMeta[] {
    return [
        {
            name: "金剛力士",
            region: "大砂漠",
            area: "トムンジン",
            force: false,
            repopIntervalMinutes: 60,
        },
        {
            name: "鬼炎ハサミ虫",
            region: "大砂漠",
            area: "炎天の大地",
            force: false,
            repopIntervalMinutes: 60,
        },
        {
            name: "黒唱族族長",
            region: "大砂漠",
            area: "ザジ岩峰",
            force: false,
            repopIntervalMinutes: 60,
        },
        {
            name: "ヤゴルタ",
            region: "大砂漠",
            area: "五色岩都",
            force: false,
            repopIntervalMinutes: 60,
        },
        {
            name: "黒獣神",
            region: "水月平原",
            area: "狼の丘陵",
            force: false,
            repopIntervalMinutes: 120,
        },
        {
            name: "ボルコロッソ族野蛮戦士",
            region: "水月平原",
            area: "養豚場",
            force: false,
            repopIntervalMinutes: 120,
        },
        {
            name: "ゴルラク軍訓練教官",
            region: "水月平原",
            area: "半月湖",
            force: false,
            repopIntervalMinutes: 120,
        },
        {
            name: "鬼蛮",
            region: "水月平原",
            area: "霧霞の森",
            force: false,
            repopIntervalMinutes: 180,
        },
        {
            name: "陰玄儡",
            region: "水月平原",
            area: "悪鬼都市",
            force: true,
            repopIntervalMinutes: 120,
        },
        {
            name: "捕食者ブタン",
            region: "白青山脈",
            area: "風の平野",
            force: false,
            repopIntervalMinutes: 180,
        },
        {
            name: "鋭いキバ",
            region: "白青山脈",
            area: "赤い朝焼けの盆地",
            force: false,
            repopIntervalMinutes: 240,
        },
        {
            name: "戦斧族頭目チャチャ",
            region: "白青山脈",
            area: "白樺の森",
            force: false,
            repopIntervalMinutes: 180,
        },
        {
            name: "シンブウ",
            region: "白青山脈",
            area: "ハンターの安息地",
            force: false,
            repopIntervalMinutes: 180,
        },
        {
            name: "木こり副族長ウタ",
            region: "白青山脈",
            area: "北方雪原",
            force: false,
            repopIntervalMinutes: 180,
        },
        {
            name: "兎仮面族フィク・コウ",
            region: "白青山脈",
            area: "岩の丘陵",
            force: true,
            repopIntervalMinutes: 180,
        },
    ]
}