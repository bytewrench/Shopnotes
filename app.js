// app.js

// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const authSection = document.getElementById('auth-section');
const journalSection = document.getElementById('journal-section');
const loginBtn = document.getElementById('login-btn');
const entryForm = document.getElementById('entry-form');
const entriesList = document.getElementById('entries-list');

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Login
loginBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Logged in:', result.user);
        })
        .catch((error) => {
            console.error('Login error:', error);
        });
});

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        authSection.classList.add('d-none');
        journalSection.classList.remove('d-none');
        loadEntries();
    } else {
        authSection.classList.remove('d-none');
        journalSection.classList.add('d-none');
    }
});

// Submit entry
entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('role').value;
    const date = document.getElementById('entry-date').value;
    const content = document.getElementById('entry-content').value;
    const user = auth.currentUser;

    if (user && role && date && content) {
        db.collection('entries').add({
            role,
            date,
            content,
            userName: user.displayName || 'Anonymous',
            userId: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            entryForm.reset();
            loadEntries();
        })
        .catch((error) => {
            console.error('Error adding entry:', error);
        });
    }
});

// Load entries from past week
function loadEntries() {
    entriesList.innerHTML = '';
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    db.collection('entries')
        .where('timestamp', '>', firebase.firestore.Timestamp.fromDate(oneWeekAgo))
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const entryItem = document.createElement('div');
                entryItem.classList.add('list-group-item');
                entryItem.innerHTML = `
                    <h6>${data.role} - ${data.userName} (${data.date})</h6>
                    <p>${data.content}</p>
                `;
                entriesList.appendChild(entryItem);
            });
        })
        .catch((error) => {
            console.error('Error loading entries:', error);
        });
}
