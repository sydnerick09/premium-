// Stub for @react-native-firebase/* on web
const noop = () => {};
const noopAsync = async () => {};
const mockApp = {
  auth: () => ({
    onAuthStateChanged: (cb) => { setTimeout(() => cb(null), 50); return noop; },
    signInWithEmailAndPassword: noopAsync,
    createUserWithEmailAndPassword: noopAsync,
    signOut: noopAsync,
    sendPasswordResetEmail: noopAsync,
    currentUser: null,
  }),
  firestore: () => ({
    collection: () => ({ doc: () => ({ set: noopAsync, get: noopAsync, update: noopAsync, delete: noopAsync, onSnapshot: (cb) => { cb({ data: () => null, exists: false }); return noop; } }) }),
  }),
  storage: () => ({ ref: () => ({ putFile: noopAsync, getDownloadURL: async () => '' }) }),
  analytics: () => ({ logEvent: noop, setUserId: noop }),
  crashlytics: () => ({ recordError: noop, log: noop }),
};

const firebaseStub = () => mockApp;
firebaseStub.auth = mockApp.auth;
firebaseStub.firestore = mockApp.firestore;
firebaseStub.storage = mockApp.storage;
firebaseStub.analytics = mockApp.analytics;
firebaseStub.crashlytics = mockApp.crashlytics;

module.exports = firebaseStub;
module.exports.default = firebaseStub;
module.exports.firebase = firebaseStub;
