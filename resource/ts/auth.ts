import firebase from "firebase";
import firebaseui from "firebaseui-ja";

/***************************************************
 * Authentication.
 ***************************************************/
let authStateChangedHandler = (user: any) => {}
let loginUser: any;
firebase.auth().onAuthStateChanged((user) => {
    if (authStateChangedHandler) {
        authStateChangedHandler(user)
    }
});
new firebaseui.auth.AuthUI(firebase.auth()).start('#firebaseui-auth-container', {
    callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
            return false;
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
export function onAuthStateChanged(handler: (user: any) => void) {
    authStateChangedHandler = handler
    if (!loginUser) {
        handler(loginUser)
    }
}

export async function logout() {
    await firebase.auth().signOut()
}