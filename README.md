# Monument Shop Journal (Shopnotes)

This repository contains a simple web app for team members to add weekly shop notes. The app uses Firebase Authentication (Google Sign-in) and Firestore for storing entries.

This branch (prep-firebase) updates the site to use the Firebase compat SDK so the existing app.js (namespaced Firebase API) works without code changes, and adds setup instructions.

Setup: connect to Firebase

1. Create a Firebase project
   - Go to https://console.firebase.google.com and create a new project.

2. Enable Google Authentication
   - In your Firebase project console, go to Authentication -> Sign-in method and enable "Google".

3. Create a Firestore database
   - Go to Firestore Database and create a database (start in test mode for initial testing).

4. Copy your Firebase config
   - In Project settings -> SDK setup and configuration, copy the Web app configuration object.

5. Paste the config into app.js
   - Open app.js and replace the firebaseConfig placeholder object with your project's config values.

6. Add authorized domain for GitHub Pages
   - In Authentication -> Settings -> Authorized domains, add `bytewrench.github.io` (or your GitHub Pages domain) so Google sign-in works when served from Pages.

Publish on GitHub Pages

- Go to your repository Settings -> Pages and set the Source to the main branch (root) or to the gh-pages branch if you prefer. After a few minutes your site will be available at:

  https://bytewrench.github.io/Shopnotes

Notes

- The Firebase config values are public client-side keys and are safe to include in this repo, but do not add private service account keys here.
- After connecting Firebase, consider updating your Firestore security rules to restrict read/write to authenticated users.
