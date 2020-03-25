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
const messaging = Firebase.messaging();
messaging.usePublicVapidKey("BO7dBdApvC_gpN-ZRzFUAlUCFDfFEObmx5-PUlkYqS0M_5XEwY4bFpPbZmkklCwCuq1zMxcdWsGMIg4i_HTfKMs");
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then((registration) => {
            messaging.useServiceWorker(registration);
            return messaging.requestPermission()
        })
        .then((result) => {
            console.log(`request permission result: ${result}`);
        })
        ;
}

export async function updateDefeatedTime(server: string, bossIdAtServer: string, time: Timestamp): Promise<void> {
    const doc = await firestore.doc(`${COLLECTION_ID}/${server}/cycles/${bossIdAtServer}`)
    await doc.update({
        lastDefeatedTime: new Date(time.seconds * 1000),
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
export function prepareNotification() {
    Notification.requestPermission()
        .then(result => {
            if (result === "granted") {
                console.log("Notification: OK");
            } else {
                console.log("Notification: ermission denied.");
            }
        });
}