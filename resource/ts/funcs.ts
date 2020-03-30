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
    messagingSenderId: "AAAAKQvju0E:APA91bF-JQoI-fsxhA1dsO5ZNi-IOUylmhM7Rqay5d0z2IYy7FcqFLSmv0BcWXZotqrdbu2lmVhOvpenK-Q86k4yRv5Rcix-RsYvMpe4PthnOzw84zEWh9HnYZKSpT288w1fbkKDySM-",
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    projectId: "blade-and-soul-field-bos-c21bf",
});
const firestore = Firebase.firestore();
const messaging = getMessaging();

function getMessaging(): Firebase.messaging.Messaging {
    const ret = Firebase.messaging();
    ret.usePublicVapidKey("BO7dBdApvC_gpN-ZRzFUAlUCFDfFEObmx5-PUlkYqS0M_5XEwY4bFpPbZmkklCwCuq1zMxcdWsGMIg4i_HTfKMs");
    Notification.requestPermission()
        .then((permission) => {
            if (permission !== "granted") {
                console.log(`permission denied. -> ${permission}`);
                return;
            }
            return messaging.getToken();
        })
        .then((currentToken) => {
            if (!currentToken) {
                console.log(`get token failed. -> ${currentToken}`);
                return;
            }
            // TOD サーバにトークンを送付？
            console.log(`token get. -> ${currentToken}`);
        })
        .catch((err) => {
            console.log("Error ocurred!!");
            console.log(err);
        })
        ;
    return ret;
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