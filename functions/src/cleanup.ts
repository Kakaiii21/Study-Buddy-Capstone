import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()

export const cleanupDeactivatedAccounts = onSchedule('every 24 hours', async () => {
  const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30
  const cutoff = Date.now() - thirtyDaysMs

  const snap = await admin.firestore()
    .collection('users')
    .where('status', '==', 'deactivated')
    .where('deactivatedAt', '<', cutoff)
    .get()

  console.log(`[cleanupDeactivatedAccounts] Found ${snap.size} accounts to delete`)

  for (const docSnap of snap.docs) {
    const uid = docSnap.id
    const data = docSnap.data()

    try {
      await admin.auth().deleteUser(uid)
    } catch (err) {
      console.error(`Failed to delete Auth user ${uid}:`, err)
    }

    if (data?.email) {
      await admin.firestore().doc(`emails/${data.email}`).delete().catch(() => null)
    }

    await docSnap.ref.delete()
    console.log(`[cleanupDeactivatedAccounts] Deleted user ${uid}`)
  }
})