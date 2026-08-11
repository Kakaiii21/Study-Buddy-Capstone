// One-time script: creates loadtest_user_1..50@studybuddyph.site in
// Firebase Auth + a matching users/{uid} Firestore doc, so the k6
// script has real accounts to log in as.
//
// Run this ONCE from your machine (not deployed, not part of the app):
//   node seed-loadtest-users.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// ---- Setup ----
// 1. Firebase Console -> Project Settings -> Service Accounts
// 2. Click "Generate new private key" -> downloads a JSON file
// 3. Save it next to this script as serviceAccountKey.json
//    (DO NOT commit this file to git — it's a real credential)
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

const NUM_USERS = 50;
const PASSWORD = 'LoadTest123!';

async function seedUsers() {
  for (let i = 1; i <= NUM_USERS; i++) {
    const email = `loadtest_user_${i}@studybuddyph.site`;

    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log(`[${i}/${NUM_USERS}] already exists: ${email}`);
      } catch {
        userRecord = await auth.createUser({
          email,
          password: PASSWORD,
          emailVerified: true,
          displayName: `Load Test User ${i}`,
        });
        console.log(`[${i}/${NUM_USERS}] created: ${email}`);
      }

      await db.doc(`users/${userRecord.uid}`).set(
        {
          firstName: 'Load',
          lastName: `Test${i}`,
          email,
          createdAt: new Date(),
          hasCustomizedCard: false,
        },
        { merge: true }
      );

      await db.doc(`emails/${email}`).set({ uid: userRecord.uid });
    } catch (err) {
      console.error(`[${i}/${NUM_USERS}] FAILED for ${email}:`, err.message);
    }
  }

  console.log('Done seeding load-test users.');
  process.exit(0);
}

seedUsers();