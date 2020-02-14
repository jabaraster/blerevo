import * as Firebase from "firebase";

Firebase.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
});
const firestore = Firebase.firestore();
const dataRoot = firestore.collection("field-boss-cycle-2");

async function addServer(server: string) {
    await firestore.runTransaction(async _ => {
        return await dataRoot.doc(server).set({})
        .catch((err) => {
            console.log(err);
        });
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
}


async function main() {
    await addServer("ケヤキ");
}

main();

interface FieldBossMeta {
    name: string,
    region: string,
    area: string,
    repopIntervalMinutes: number,
}

function createMasterData(): FieldBossMeta[] {
    return [
        {
            name: "黒獣神",
            region: "水月平原",
            area: "狼の丘陵",
            repopIntervalMinutes: 120,
        },
        {
            name: "ボルコロッソ族野蛮戦士",
            region: "水月平原",
            area: "養豚場",
            repopIntervalMinutes: 120,
        },
        {
            name: "ゴルラク軍訓練教官",
            region: "水月平原",
            area: "半月湖",
            repopIntervalMinutes: 120,
        },
        {
            name: "鬼蛮",
            region: "水月平原",
            area: "霧霞の森",
            repopIntervalMinutes: 180,
        },
        {
            name: "陰玄儡",
            region: "水月平原",
            area: "悪鬼都市",
            repopIntervalMinutes: 120,
        },
        {
            name: "捕食者ブタン",
            region: "白青山脈",
            area: "風の平野",
            repopIntervalMinutes: 180,
        },
        {
            name: "鋭いキバ",
            region: "白青山脈",
            area: "赤い朝焼けの盆地",
            repopIntervalMinutes: 240,
        },
        {
            name: "戦斧族頭目チャチャ",
            region: "白青山脈",
            area: "白樺の森",
            repopIntervalMinutes: 180,
        },
        {
            name: "シンブウ",
            region: "白青山脈",
            area: "ハンターの安息地",
            repopIntervalMinutes: 180,
        },
        {
            name: "木こり副族長ウタ",
            region: "白青山脈",
            area: "北方雪原",
            repopIntervalMinutes: 180,
        },
        {
            name: "兎仮面族フィク・コウ",
            region: "白青山脈",
            area: "岩の丘陵",
            repopIntervalMinutes: 180,
        },
    ]
}