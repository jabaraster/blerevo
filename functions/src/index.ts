import fb from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import * as functions from 'firebase-functions';
import axios from 'axios';
import admin from 'firebase-admin';

const firebase = !fb.apps.length ? fb.initializeApp({
    apiKey: "AIzaSyA8OgTiooOW4F97YTBVw5PuaR1p9oo4R9g",
    authDomain: "blade-and-soul-field-bos-c21bf.firebaseapp.com",
    databaseURL: "https://blade-and-soul-field-bos-c21bf.firebaseio.com",
    projectId: "blade-and-soul-field-bos-c21bf",
    storageBucket: "blade-and-soul-field-bos-c21bf.appspot.com",
    messagingSenderId: "176293133121",
    appId: "1:176293133121:web:570cb3854312fea1ab7fc0",
    measurementId: "G-2YYBYEEG7G"
}) : fb.app()
admin.initializeApp({
    databaseURL: "https://blade-and-soul-field-bos-c21bf.firebaseio.com",
    projectId: "blade-and-soul-field-bos-c21bf",
    storageBucket: "blade-and-soul-field-bos-c21bf.appspot.com",
})

const firestore = firebase.firestore()

const COLLECTION_ID = "field-boss-cycle-2";
const RE_NOTIFICATION_THRESHOLD = 10;
const WITHIN_MINUTE_NORMAL_BOSS = 3;
const WITHIN_MINUTE_REPLACE_BOSS = 6;

function env(name: string): string {
    const notf = functions.config().notification;
    if (notf) {
        return notf[name];
    } else {
        const s = process.env[name];
        return s ? s : "";
    }
}

const DEFAULT_SERVER = 'ケヤキ' // 歴史的経緯からケヤキのまま
const functionBuilder = functions.region("asia-northeast1")

exports.personalizedNotification = functionBuilder.pubsub.schedule('every 1 minutes').onRun(async () => {
    await personalizedNotificationCore('テスト')
})

exports.notification = functionBuilder.pubsub.schedule("every 1 minutes").onRun(async context => {
    await notificationCore("ケヤキ");
    await notificationCore("サクラ");
});

export const personalizedNotificationCore = async function(server: string = DEFAULT_SERVER) {
    const CATEGORY = 'personalizedNotificated'
    const now = new Date();
    const bossList = await getNotificationBossList(server, CATEGORY, now)
    console.log(`${bossList.length}体のボスを通知します.`)
    if (bossList.length === 0) {
        return;
    }

    // ユーザの通知情報を取得する
    const userNotificationsRef = firestore.collection(`${COLLECTION_ID}/${server}/personalizedNotification/`)
    const userNotificationsDoc = await userNotificationsRef.get()

    const bossToNotificationTokens = userNotificationsDoc.docs.reduce((acum, snapshot) => {
        const userNotif = snapshot.data() as UserNotification
        userNotif.notificationBossIds.forEach((bossId) => {
            if (!acum.has(bossId)) {
                acum.set(bossId, [])
            }
            acum.set(bossId, acum.get(bossId)!.concat([userNotif.notificationToken]))
        })
        return acum
    }, new Map<FieldBossId, NotificationToken[]>())

    // ボス毎に通知を回す
    const sendPromises = bossList
        .filter((boss) => {
            if (!bossToNotificationTokens.has(boss.id)) {
                return false
            }
            if (bossToNotificationTokens.get(boss.id)!.length === 0) {
                return false
            }
            return true
        })
        .map((boss) => {
            console.log('通知を実行: ', boss.name)
            return admin.messaging().sendMulticast({
                notification: {
                    title: `${server}サーバ FB湧きます！`,
                    body: buildNotificationMessage(now, boss),
                },
                tokens: bossToNotificationTokens.get(boss.id)!,
            })
        })

    const notificatedMapPromise = listNotificated(server, CATEGORY);
    const notificatedMap = (await notificatedMapPromise)
        .reduce((accum, notificated) => {
            accum.set(notificated.data().bossId, notificated);
            return accum;
        }, new Map<string, Notificated>())
        ;
    await Promise.all(bossList.map(async boss => {
        const notificated = notificatedMap.get(boss.id);
        if (!notificated) {
            await getNotificatedCollection(server, CATEGORY)
                .add({ bossId: boss.id, notificatedTime: now });
        } else {
            await notificated.ref.update({ notificatedTime: now });
        }
     }));
    await Promise.all(sendPromises)
}

export const notificationCore = async function(server: string) {
    const CATEGORY = 'notificated'
    const now = new Date();
    const notificatedMapPromise = listNotificated(server, CATEGORY);
    const bossList = await getNotificationBossList(server, CATEGORY, now)
    if (bossList.length === 0) {
        return;
    }

    const notificatedMap = (await notificatedMapPromise)
        .reduce((accum, notificated) => {
            accum.set(notificated.data().bossId, notificated);
            return accum;
        }, new Map<string, Notificated>())
        ;
    const text = bossList
        .sort((a, b) => {
            return a.nextPopTime.getTime() - b.nextPopTime.getTime(); // 出現順が早いものを先に並べる
        })
        .reduce((accum, boss) => {
            return accum + "\n" + buildNotificationMessage(now, boss);
        }, `${server}サーバ FB湧きます！`)
        ;

    const updatePromise = Promise.all(bossList.map(async boss => {
        const notificated = notificatedMap.get(boss.id);
        if (!notificated) {
            await getNotificatedCollection(server, CATEGORY)
                .add({ bossId: boss.id, notificatedTime: now });
        } else {
            await notificated.ref.update({ notificatedTime: now });
        }
    }));
    const notificationPromise = axios.post(`https://api.push7.jp/api/v1/${env("push_7_appno")}/send`, {
        apikey: env("push_7_apikey"),
        title: "HASTOOLフィルボ通知",
        body: text,
        icon: "https://hastool.me/hastool-logo.png",
        url: `https://hastool.me/${server}`,
    });

    await updatePromise;
    await notificationPromise;
}

async function getNotificationBossList(server: string, category: string, now: Date): Promise<ExFieldBossCycle[]> {
    const notificatedMapPromise = listNotificated(server, category);
    const bossListPromise = listCycles(server);
    const notificatedMap = (await notificatedMapPromise)
        .reduce((accum, notificated) => {
            accum.set(notificated.data().bossId, notificated);
            return accum;
        }, new Map<string, Notificated>())
        ;
    return (await bossListPromise)
        .map(boss => {
            return Object.assign(boss, { nextPopTime: nextPopTime(now, boss)});
        })
        .filter(boss => {
            if (!withinMinute(boss.region === '入れ替わるFB' ? WITHIN_MINUTE_REPLACE_BOSS : WITHIN_MINUTE_NORMAL_BOSS, now, boss.nextPopTime)) {
                return false;
            }
            if (boss.repopIntervalMinutes <= 60) { // 頻繁にリポップスするボスは鬱陶しいので割愛
                return false;
            }
            if (!boss.reliability) { // 信憑性のある情報のみ通知
                return false;
            }
            const notificated = notificatedMap.get(boss.id);
            if (!notificated) {
                return true;
            }
            return !withinMinute(RE_NOTIFICATION_THRESHOLD, notificated.data().notificatedTime.toDate(), now);
        });
}

function withinMinute(minute: number, time1: Date, time2: Date): boolean {
    return (time2.getTime() - time1.getTime()) <= minute * 60 * 1000;
}

function buildNotificationMessage(now: Date, boss: ExFieldBossCycle): string {
    const remainMillisec = boss.nextPopTime.getTime() - now.getTime();
    const remainMinute = Math.round(remainMillisec / 1000 / 60);
    return `${remainMinute}分後 ${boss.name}`;
}

type NotificationToken = string;
type FieldBossId = string;
type Timestamp = fb.firestore.Timestamp;
type Notificated = fb.firestore.QueryDocumentSnapshot<fb.firestore.DocumentData>;
type DocumentData = fb.firestore.DocumentData;
type CollectionReference<T> = fb.firestore.CollectionReference<T>;
interface FieldBossCycle {
    name: string;
    id: string;
    region: string;
    area: string;
    force: boolean,
    lastDefeatedTime: Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
    reliability : boolean;
}
interface ExFieldBossCycle extends FieldBossCycle {
    nextPopTime: Date;
}
interface UserNotification {
    notificationToken: string;
    notificationBossIds: string[];
}

function nextPopTime(now: Date, boss: FieldBossCycle): Date {
    let t = null;
    for (t = boss.lastDefeatedTime.toDate()
         ; t.getTime() <= now.getTime()
         ; t = new Date(t.getTime() + boss.repopIntervalMinutes * 60 * 1000)
        );
    return t;
}

function getBossCycleListCollection(server: string): CollectionReference<DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/cycles/`);
}

function getNotificatedCollection(server: string, category: string): CollectionReference<DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/${category}/`);
}

async function listCycles(server: string): Promise<FieldBossCycle[]> {
    const ret: any[] = [];
    await getBossCycleListCollection(server)
    .orderBy("sortOrder", "asc")
    .get()
    .then((d) => {
        d.forEach(r => {
            ret.push(r.data());
        });
    })
    return ret;
}

async function listNotificated(server: string, category: string): Promise<Notificated[]> {
    const ret: any = [];
    await getNotificatedCollection(server, category)
    .get()
    .then(res => {
        res.forEach(doc => {
            ret.push(doc);
        });
    });
    return ret;
}