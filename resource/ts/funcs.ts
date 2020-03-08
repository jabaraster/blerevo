import * as Firebase from "firebase";

const COLLECTION_ID = "field-boss-cycle-2";

interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

interface FieldBossCycle {
    name: string;
    id: String;
    serverId: String;
    region: string;
    area: string;
    channel: number;
    lastDefeatedTime: Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
}

Firebase.initializeApp({
    projectId: "blade-and-soul-field-bos-c21bf",
});
const firestore = Firebase.firestore();

export async function updateDefeatedTime(server: string, bossIdAtServer: string, time: Timestamp): Promise<void> {
    const doc = await firestore.doc(`${COLLECTION_ID}/${server}/cycles/${bossIdAtServer}`)
    await doc.update({
        lastDefeatedTime: time,
    })
}

export async function listCycles(server: string): Promise<FieldBossCycle[]> {
    const ret: FieldBossCycle[] = [];
    await firestore.collection(`${COLLECTION_ID}/${server}/cycles/`)
    .orderBy("sortOrder", "asc")
    .get()
    .then(d => {
        d.forEach(r => {
            const d: any = r.data();
            d.serverId = r.id;
            ret.push(d);
        });
    })
    return ret;
}