import * as functions from 'firebase-functions';
import * as Firebase from "firebase";
import Axios from "axios";

const COLLECTION_ID = "field-boss-cycle-2";
const RE_NOTIFICATION_THRESHOLD = 10;
const WITHIN_MINUTE_NORMAL_BOSS = 3;
const WITHIN_MINUTE_REPLACE_BOSS = 6;

Firebase.initializeApp({
    projectId: "blade-and-soul-field-bos-c21bf",
});
const firestore = Firebase.firestore();

function env(name: string): string {
    const notf = functions.config().notification;
    if (notf) {
        return notf[name];
    } else {
        const s = process.env[name];
        return s ? s : "";
    }
}

export const notification = functions.pubsub.schedule("every 1 minutes").onRun(async context => {
    await notificationCore("ケヤキ");
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
            if (boss.force) { // 勢力ボスは追わない…
                return false;
            }
            if (boss.repopIntervalMinutes <= 60) { // 頻繁にリポップスするボスは鬱陶しいので割愛
                return false;
            }
            if (!boss.reliability) { // 信憑性のある情報のみ通知
                return true;
            }
            const notificated = notificatedMap.get(boss.id);
            if (!notificated) {
                return true;
            }
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
        url: "https://hastool.me",
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
    lastDefeatedTime: Firebase.firestore.Timestamp;
    repopIntervalMinutes: number;
    sortOrder: number;
    reliability : boolean;
}
interface ExFieldBossCycle extends FieldBossCycle {
    nextPopTime: Date;
}

type Notificated = Firebase.firestore.QueryDocumentSnapshot<Firebase.firestore.DocumentData>;

function nextPopTime(now: Date, boss: FieldBossCycle): Date {
    let t = null;
    for (t = boss.lastDefeatedTime.toDate()
         ; t.getTime() <= now.getTime()
         ; t = new Date(t.getTime() + boss.repopIntervalMinutes * 60 * 1000)
        );
    return t;
}

function getBossCycleListCollection(server: string): Firebase.firestore.CollectionReference<Firebase.firestore.DocumentData> {
    return firestore.collection(`${COLLECTION_ID}/${server}/cycles/`);
}

function getNotificatedCollection(server: string): Firebase.firestore.CollectionReference<Firebase.firestore.DocumentData> {
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