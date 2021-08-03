import firebase from "firebase";

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

firebase.initializeApp({
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
const firestore = firebase.firestore();
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

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
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
    const messaging = firebase.messaging();
    const token = await messaging.getToken()
    const userNotification = await registerNotificationToken({ server, uid, token})
    messaging.onMessage((payload) => {
        console.log('onMessage:', payload)
        // TODO 画面に反映
    })
    return userNotification
}
interface UserNotification {
    uid: string;
    notificationToken: string;
    notifiable: boolean;
    notificationBossIds: string[];
}
function getUserNotificationDocRef({ server, uid }: { server: string, uid: string): firebase.firestore.DocumentReference {
    return firestore.doc(`${COLLECTION_ID}/${server}/personalizedNotification/${uid}`)
}
export async function registerNotificationToken(
        { server, uid, token }: { server: string, uid: string, token: string }
        ): Promise<UserNotification> {
    // TODO Firefoxの場合、ユーザ操作のないイベントから通知に関するAPIを呼ぶとエラーとなる.
    const userNotifDocRef = getUserNotificationDocRef({ server, uid })
    const userNotifDoc = await userNotifDocRef.get()
    if (userNotifDoc.exists) {
        await userNotifDocRef.update({
            notificationToken: token,
            notifiable: true,
        })
        return userNotifDoc.data() as UserNotification
    } else {
        const newUserNotif: UserNotification = {
            uid,
            notificationToken: token,
            notifiable: true,
            notificationBossIds: [],
        }
        await userNotifDocRef.set(newUserNotif)
        return newUserNotif
    }
}
export async function switchBossNotification(
        { server, uid, bossId }: { server: string, uid: string, bossId: string }
        ) {
    // TODO Firefoxの場合、ユーザ操作のないイベントから通知に関するAPIを呼ぶとエラーとなる.
    const userNotifDocRef = getUserNotificationDocRef({ server, uid })
    const userNotifDoc = await userNotifDocRef.get()
    const userNotif = userNotifDoc.data() as UserNotification
    const bossIds = userNotif.notificationBossIds
    const idx = bossIds.indexOf(bossId)
    if (idx < 0) {
        bossIds.push(bossId)
    } else {
        bossIds.splice(idx, 1)
    }
    await userNotifDocRef.update({
        notificationBossIds: bossIds
    })
}
export async function setUserNotifiable(
    { server, uid, notifiable }: { server: string, uid: string, notifiable: boolean}
    ): Promise<void> {
    const userNotifDocRef = getUserNotificationDocRef({ server, uid })
    await userNotifDocRef.update({
        notifiable
    })
}