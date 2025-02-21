import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  OAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import config from "./config.js";
const firebaseApp = initializeApp(config);

const auth = getAuth();

const signInButton = document.getElementById('sign-in')

function toggleSignIn() {
  if (!auth.currentUser) {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      tenant: 'kagreaterseattle.com',
    });

    provider.addScope('User.Read');
    signInWithPopup(auth, provider)
      .then(function (result) {
        auth.currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
          document.cookie = `idToken=${idToken};`;
        }).catch(function(error) {
          console.error(error);
        });

        window.location.href = "/";
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    signOut(auth);
  }
}

onAuthStateChanged(auth, function (user) {
  // Something could happen here
});

signInButton.addEventListener('click', toggleSignIn, false);