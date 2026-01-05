// app.js

// Replace with your Firebase config if you want Firestore support.
// If you leave placeholders, the app will still work using localStorage.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

let db = null;
let useFirestore = false;

try {
    // Initialize Firebase only if the SDK is present
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        // Avoid initializing with placeholder config
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_')) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirestore = true;
        } else {
            // initialize app without config to avoid errors if no config provided
            try { firebase.initializeApp(firebaseConfig); } catch (e) { /* ignore */ }
        }
    }
} catch (e) {
    console.warn('Firebase init failed or not configured — falling back to localStorage', e);
}

// Elements
const journalSection = document.getElementById('journal-section');
const entryForm = document.getElementById('entry-form');
const entriesList = document.getElementById('entries-list');

// LocalStorage key
const LS_KEY = 'shopnotes_entries_v1';

// Helpers for localStorage
function saveLocalEntry(entry) {
    const list = getLocalEntries();
    list.push(entry);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function getLocalEntries() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function displayEntries(entries) {
    // entries: array of {role, date, content, userName, timestamp}
    entriesList.innerHTML = '';
    // sort descending by timestamp
    entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    entries.forEach((data) => {
        const entryItem = document.createElement('div');
        entryItem.classList.add('list-group-item');
        const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : data.date;
        entryItem.innerHTML = `
            <h6>${escapeHtml(data.role)} - ${escapeHtml(data.userName || 'Guest')} (${escapeHtml(data.date)})</h6>
            <small class="text-muted">${escapeHtml(ts)}</small>
            <p class="mt-2">${escapeHtml(data.content)}</p>
        `;
        entriesList.appendChild(entryItem);
    });
}

// Basic escaping to reduce XSS risk for this example
function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('role').value;
    const date = document.getElementById('entry-date').value;
    const content = document.getElementById('entry-content').value;

    if (!role || !date || !content) return;

    const entry = {
        role,
        date,
        content,
        userName: 'Guest',
        timestamp: Date.now()
    };

    if (useFirestore && db) {
        // Try to write to Firestore; if it fails, fall back to localStorage.
        db.collection('entries').add({
            role: entry.role,
            date: entry.date,
            content: entry.content,
            userName: entry.userName,
            // Use server timestamp for Firestore entries
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // After successful write, reload entries (will attempt Firestore read)
            entryForm.reset();
            loadEntries();
        })
        .catch((err) => {
            console.warn('Firestore write failed, saving locally instead:', err);
            saveLocalEntry(entry);
            entryForm.reset();
            loadEntries();
        });
    } else {
        // No Firestore available — save locally
        saveLocalEntry(entry);
        entryForm.reset();
        loadEntries();
    }
});

function loadEntries() {
    // Load local entries
    const localEntries = getLocalEntries();

    if (useFirestore && db) {
        // Attempt to read recent Firestore entries (past week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        db.collection('entries')
            .where('timestamp', '>', firebase.firestore.Timestamp.fromDate(oneWeekAgo))
            .orderBy('timestamp', 'desc')
            .get()
            .then((querySnapshot) => {
                const firestoreEntries = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // If timestamp is a Firestore Timestamp object, convert to millis
                    const ts = data.timestamp && data.timestamp.toMillis ? data.timestamp.toMillis() : Date.now();
                    firestoreEntries.push({
                        role: data.role || '',
                        date: data.date || '',
                        content: data.content || '',
                        userName: data.userName || 'Guest',
                        timestamp: ts
                    });
                });
                // Merge firestore + local and display
                const merged = firestoreEntries.concat(localEntries);
                displayEntries(merged);
            })
            .catch((err) => {
                console.warn('Firestore read failed — showing local entries only:', err);
                displayEntries(localEntries);
            });
    } else {
        displayEntries(localEntries);
    }
}

// Initial load
loadEntries();
