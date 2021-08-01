import funcs from "firebase";

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

funcs.initializeApp({
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    authDomain: "blade-and-soul-field-bos-c21bf.firebaseapp.com",
    databaseURL: "https://blade-and-soul-field-bos-c21bf.firebaseio.com",
    projectId: "blade-and-soul-field-bos-c21bf",
    storageBucket: "blade-and-soul-field-bos-c21bf.appspot.com",
    messagingSenderId: "176293133121",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    measurementId: "G-2YYBYEEG7G"
});

/***************************************************
 * Datastore.
 ***************************************************/
const firestore = funcs.firestore();
export async function updateDefeatedTime(server: string, bossIdAtServer: string, time: Timestamp, reliability: boolean): Promise<void> {
    const doc = await firestore.doc(`${COLLECTION_ID}/${server}/cycles/${bossIdAtServer}`)
    await doc.update({
        lastDefeatedTime: new Date(time.seconds * 1000),
        reliability,
    })
}

export async function listCycles(server: string, updateCallback:(boss: FieldBossCycle) => void ): Promise<FieldBossCycle[]> {
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

type DocumentSnapshot = funcs.firestore.DocumentSnapshot;
function docToBoss(doc: DocumentSnapshot): FieldBossCycle {
    const ret = doc.data() as FieldBossCycle;
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
    result: object | null;
}
export function getViewOption(): ViewOptionResult | null {
    if (!window.localStorage) {
        return null;
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

/***************************************************
 * Notification.
 ***************************************************/
export async function registerNotification(
    { server, uid }: { server: string, uid: string }
): Promise<UserNotification> {
    const messaging = funcs.messaging();
    const token = await messaging.getToken()
    const userNotification = await registerNotificationToken({ server, uid, token})
    messaging.onMessage((payload) => {
        // TODO 画面で受け取る
        console.log(payload)
    })
    console.log(userNotification) 
    return userNotification
}
interface UserNotification {
    uid: string;
    notificationToken: string;
    notificationBossIds: string[];
}
export async function registerNotificationToken(
        { server, uid, token }: { server: string, uid: string, token: string }
        ): Promise<UserNotification> {
    const userNotifDocRef = firestore.doc(`${COLLECTION_ID}/${server}/personalizedNotification/${uid}`)
    const userNotifDoc = await userNotifDocRef.get()
    if (userNotifDoc.exists) {
        userNotifDocRef.update({
            notificationToken: token
        })
        return userNotifDoc.data() as UserNotification
    } else {
        const newUserNotif: UserNotification = {
            uid,
            notificationToken: token,
            notificationBossIds: []
        }
        userNotifDocRef.set(newUserNotif)
        return newUserNotif
    }
}