import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  OAuthProvider,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { config } from "./config.js";
const firebaseApp = initializeApp(config);

const auth = getAuth();

if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}

const signInButton = document.getElementById('sign-in')

function toggleSignIn() {
  if (!auth.currentUser) {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      tenant: 'eastsideprep.org'
    });

    provider.addScope('User.Read');
    signInWithPopup(auth, provider)
      .then(function (result) {
        const credential = OAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const idToken = credential?.idToken;
        const user = result.user;
        
        console.log(token);
        console.log(idToken);

        document.cookie = `token=${token};`;
        document.cookie = `idToken=${idToken};`;

        // TODOS: make sure this works, add authorization to all headers. Then, commit.

        if (user) {
          console.log(user);
          const displayName = user.displayName;
          const email = user.email;
          const emailVerified = user.emailVerified;
          const isAnonymous = user.isAnonymous;
          const uid = user.uid;
          const providerData = user.providerData;
        }
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

/*
  firebase.auth().currentUser.getIdToken( true).then(function(idToken) {
    // Send token to your backend via HTTPS
    // ...
  }).catch(function(error) {
    // Handle error
  });
*/