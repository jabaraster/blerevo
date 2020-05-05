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
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    projectId: "blade-and-soul-field-bos-c21bf",
});
const firestore = Firebase.firestore();

export async function updateDefeatedTime(server: string, bossIdAtServer: string, time: Timestamp, reliability: boolean): Promise<void> {
    const doc = await firestore.doc(`${COLLECTION_ID}/${server}/cycles/${bossIdAtServer}`)
    await doc.update({
        lastDefeatedTime: new Date(time.seconds * 1000),
        reliability,
    })
}

export async function listCycles(server: string, updateCallback:(FieldBossCycle) => void ): Promise<FieldBossCycle[]> {
    const collection = await firestore.collection(`${COLLECTION_ID}/${server}/cycles/`)
                            .get();

    const ret: FieldBossCycle[] = [];
    collection.forEach(r => {
        firestore.collection(`${COLLECTION_ID}/${server}/cycles/`).doc(r.id)
            .onSnapshot((doc) => {
                if (!doc.metadata.hasPendingWrites) {
                    updateCallback(docToBoss(doc));
                }
            });
        ret.push(docToBoss(r));
    });

    return ret;
}

function docToBoss(doc): FieldBossCycle {
    const ret = doc.data();
    ret.serverId = doc.id;
    return ret;
}

export function saveViewOption(viewOption: object) {
    if (!window.localStorage) {
        return;
    }
    window.localStorage.setItem("viewOption", JSON.stringify(viewOption));
}

interface ViewOptionResult {
    exists: boolean;
    result: object;
}
export function getViewOption(): ViewOptionResult {
    if (!window.localStorage) {
        return;
    }
    const result = window.localStorage.getItem("viewOption");
    if (result) {
        return {
            exists: true,
            result: JSON.parse(result),
        };
    } else {
        return {
            exists: false,
            result: null,
        }
    }
}