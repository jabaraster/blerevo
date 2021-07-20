import firebase from "firebase";
import firebaseui from "firebaseui-ja";
// import "firebase/auth";
// import "firebase/firestore";
// import "firebase/messaging";

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
 * Authentication.
 ***************************************************/
const authUi = new firebaseui.auth.AuthUI(firebase.auth())
let authStateChangedHandler = (user: any) => {}
let loginUser: any;
firebase.auth().onAuthStateChanged((user) => {
    if (authStateChangedHandler) {
        authStateChangedHandler(user)
    }
});
authUi.start('#firebaseui-auth-container', {
    callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          return true;
        },
        uiShown: function() {
        }
      },
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      ],
})
export function onAuthStateChanged(handler) {
    authStateChangedHandler = handler
    if (!loginUser) {
        handler(loginUser)
    }
}

export async function logout() {
    await firebase.auth().signOut()
}

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

/***************************************************
 * Notification.
 ***************************************************/
export async function registerNotification(): Promise<string> {
    try {
        const messaging = firebase.messaging();
        const token = await messaging.getToken()
        console.log(token)
        // TODO このtokenは通知先の限定に使う.
        messaging.onMessage((payload) => {
            console.log(payload)
        })
        return token
    } catch (err) {
        console.info(err)
    }
}