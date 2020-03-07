import * as Firebase from "firebase";

const COLLECTION_ID = "field-boss-cycle-2";

interface Timestamp {
    seconds: number;
}

interface FieldBossCycle {
    name: string;
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
const dataRoot = firestore.collection(COLLECTION_ID);

export async function listCycles(server: string): Promise<FieldBossCycle[]> {
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