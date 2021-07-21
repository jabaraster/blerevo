import * as functions from 'firebase-functions';
import * as firebase from "firebase";
import * as admin from "firebase-admin";
import Axios from "axios";

const COLLECTION_ID = "field-boss-cycle-2";
const RE_NOTIFICATION_THRESHOLD = 10;
const WITHIN_MINUTE_NORMAL_BOSS = 3;
const WITHIN_MINUTE_REPLACE_BOSS = 6;

// firebase.initializeApp({
//     projectId: "blade-and-soul-field-bos-c21bf",
// });

const serviceAccount = require("./serviceAccount.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

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


const firestore = firebase.firestore();

export async function sendMessageSample() {
    console.log('sendMessageSample')
    await admin.messaging().send({
        notification: {
            title: "テスト",
            body: "テストです。",
        },
        token: "cp5h4wvnlkLW4kY39kAdKn:APA91bHWCfFMI5eiN3lo6yv0y2dFZSR149RBYEvlKRvJzh16xgEurFrDlA82XQGLgLeUOJ-Q4vF6QGLi1s7cnsbDLnVnuX1kGx0j6t4xt5g9yuOXdxLQnxFg0492apUp8I7UDj2dctRl"
    })
}

function env(name: string): string {
    const notf = functions.config().notification;
    if (notf) {
        return notf[name];
    } else {
        const s = process.env[name];
        return s ? s : "";
    }
}

export const notification = functions.region("asia-northeast1").pubsub.schedule("every 1 minutes").onRun(async context => {
    await notificationCore("ケヤキ");
    await notificationCore("サクラ");
});

export const notificationCore = async function(server: string) {
    const now = new Date();
    const notificatedMapPromise = listNotificated(server);
    const bossListPromise = listCycles(server);
    const notificatedMap = (await notificatedMapPromise)
        .reduce((accum, notificated) => {
            accum.set(notificated.data().bossId, notificated);
            return accum;
        }, new Map<string, Notificated>())
        ;
    const bossList = (await bossListPromise)
        .map(boss => {
            return Object.assign(boss, { nextPopTime: nextPopTime(now, boss)});
        })
        .filter(boss => {
            if (!withinMinute(boss.region === "入れ替わるFB" ? WITHIN_MINUTE_REPLACE_BOSS : WITHIN_MINUTE_NORMAL_BOSS, now, boss.nextPopTime)) {
                return false;
            }
            // if (boss.force) { // 勢力ボスは追わない…
            //     return false;
            // }
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
            console.log("----------------");
            console.log(notificated.data());
            console.log(notificated.data().notificatedTime.toDate());
            console.log(withinMinute(RE_NOTIFICATION_THRESHOLD, notificated.data().notificatedTime.toDate(), now));
            return !withinMinute(RE_NOTIFICATION_THRESHOLD, notificated.data().notificatedTime.toDate(), now);
        });

    console.log(bossList);
    if (bossList.length === 0) {
        return;
    }

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
            await getNotificatedCollection(server)
                .add({ bossId: boss.id, notificatedTime: now });
        } else {
            await notificated.ref.update({ notificatedTime: now });
        }
    }));
    const notificationPromise = Axios.post(`https://api.push7.jp/api/v1/${env("push_7_appno")}/send`, {
        apikey: env("push_7_apikey"),
        title: "HASTOOLフィルボ通知",
        body: text,
        icon: "https://hastool.me/hastool-logo.png",
        url: `https://hastool.me/${server}`,
    });

    await updatePromise;
    const res = await notificationPromise;
    console.log(res.data);
}

function withinMinute(minute: number, time1: Date, time2: Date): boolean {
    return (time2.getTime() - time1.getTime()) <= minute * 60 * 1000;
}

function buildNotificationMessage(now: Date, boss: ExFieldBossCycle): string {
    const remainMillisec = boss.nextPopTime.getTime() - now.getTime();
    const remainMinute = Math.round(remainMillisec / 1000 / 60);
    return `${remainMinute}分後 ${boss.name}`;
}

interface FieldBossCycle {
    name: string;
    id: string;
    region: string;
    area: string;
    force: boolean,
    lastDefeatedTime: firebase.firestore.Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
    reliability : boolean;
}
interface ExFieldBossCycle extends FieldBossCycle {
    nextPopTime: Date;
}

type Notificated = firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>;

function nextPopTime(now: Date, boss: FieldBossCycle): Date {
    let t = null;
    for (t = boss.lastDefeatedTime.toDate()
         ; t.getTime() <= now.getTime()
         ; t = new Date(t.getTime() + boss.repopIntervalMinutes * 60 * 1000)
        );
    return t;
}

function getBossCycleListCollection(server: string): firebase.firestore.CollectionReference<firebase.firestore.DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/cycles/`);
}

function getNotificatedCollection(server: string): firebase.firestore.CollectionReference<firebase.firestore.DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/notificated/`);
}

async function listCycles(server: string): Promise<FieldBossCycle[]> {
    const ret: any[] = [];
    await getBossCycleListCollection(server)
    .orderBy("sortOrder", "asc")
    .get()
    .then(d => {
        d.forEach(r => {
            ret.push(r.data());
        });
    })
    return ret;
}

async function listNotificated(server: string): Promise<Notificated[]> {
    const ret: any = [];
    await getNotificatedCollection(server)
    .get()
    .then(res => {
        res.forEach(doc => {
            ret.push(doc);
        });
    });
    return ret;
}