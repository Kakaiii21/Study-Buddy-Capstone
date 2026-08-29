import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30
const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7
const WARNING_THRESHOLD_MS = THIRTY_DAYS_MS - SEVEN_DAYS_MS // i.e. deactivatedAt older than 23 days

function emailTemplate(content: string) {
  return `
    <body style="font-family:sans-serif; color:#333; margin:0; padding:30px; background-color:#EFF3FB;">
      <div style="max-width:600px; margin:auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:0.5px solid #c8d8ec;">
        <div style="background-color:#ffffff; padding:24px 30px; text-align:center; border-bottom:3px solid #195791;">
          <img src="https://studybuddyph.site/logo.png" alt="Study Buddy" style="width:160px;" />
        </div>
        <div style="padding:28px 32px;">
          ${content}
          <p style="font-size:12px; color:#999; margin-top:20px;">
            Need help? <a href="mailto:support@studybuddyph.site" style="color:#195791;">support@studybuddyph.site</a>
          </p>
        </div>
        <div style="background-color:#EFF3FB; text-align:center; padding:18px 30px;">
          <p style="font-size:13px; color:#195791; font-weight:500; margin:0 0 3px;">Study Buddy</p>
          <p style="font-size:11px; color:#999; margin:0;">Supporting your learning journey · <a href="https://studybuddyph.site" style="color:#195791;">studybuddyph.site</a></p>
        </div>
      </div>
    </body>
  `
}

function actionButton(link: string, label: string) {
  return `
    <div style="text-align:center; margin:32px 0;">
      <a href="${link}" style="background:linear-gradient(135deg,#195791,#2e7fc1); color:#ffffff; padding:13px 32px; text-decoration:none; border-radius:8px; display:inline-block; font-weight:bold; font-size:15px;">
        ${label}
      </a>
    </div>
  `
}

// Recursively delete every doc in a subcollection, batched.
async function deleteSubcollection(parentRef: FirebaseFirestore.DocumentReference, subcollectionId: string) {
  const subRef = parentRef.collection(subcollectionId)
  const snap = await subRef.get()
  if (snap.empty) return

  // For subcollections that themselves have nested subcollections (courses/files), recurse first.
  if (subcollectionId === 'courses') {
    for (const courseDoc of snap.docs) {
      await deleteSubcollection(courseDoc.ref, 'files')
    }
  }

  const batchSize = 400 // stay under Firestore's 500-write batch limit
  const docs = snap.docs
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = admin.firestore().batch()
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

// Delete a Cloudinary asset by public ID (best-effort; logs and continues on failure).
async function deleteCloudinaryAssetSafe(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image') {
  try {
    const cloudinary = await import('cloudinary')
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    await cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err)
  }
}

// Collect + delete every Cloudinary asset tied to a user before wiping their docs.
async function cleanupCloudinaryAssets(uid: string) {
  const userRef = admin.firestore().doc(`users/${uid}`)
  const userSnap = await userRef.get()
  const userData = userSnap.data()

  // Profile photo
  if (userData?.photoPublicId) {
    await deleteCloudinaryAssetSafe(userData.photoPublicId, 'image')
  }

  // Course files
  const coursesSnap = await userRef.collection('courses').get()
  for (const courseDoc of coursesSnap.docs) {
    const filesSnap = await courseDoc.ref.collection('files').get()
    for (const fileDoc of filesSnap.docs) {
      const publicId = fileDoc.data()?.publicId
      if (publicId) await deleteCloudinaryAssetSafe(publicId, 'raw')
    }
  }

  // recentlyDeleted may also reference Cloudinary assets
  const recentlyDeletedSnap = await userRef.collection('recentlyDeleted').get()
  for (const rdDoc of recentlyDeletedSnap.docs) {
    const publicId = rdDoc.data()?.cloudinaryPublicId
    if (publicId) await deleteCloudinaryAssetSafe(publicId, 'raw')
  }
}

// ── 7-DAY WARNING EMAIL ───────────────────────────────────────────────────
export const warnPendingDeletions = onSchedule(
  { schedule: 'every 24 hours', secrets: ['RESEND_API_KEY'] },
  async () => {
    const now = Date.now()
    // Window: accounts deactivated between 23 and 24 days ago haven't been warned yet.
    const windowStart = now - THIRTY_DAYS_MS // older than this = already past 30 days, skip
    const windowEnd = now - WARNING_THRESHOLD_MS // deactivatedAt <= this means 7 or fewer days remain

    const snap = await admin.firestore()
      .collection('users')
      .where('status', '==', 'deactivated')
      .where('deactivatedAt', '<=', windowEnd)
      .where('deactivatedAt', '>', windowStart)
      .get()

    console.log(`[warnPendingDeletions] Found ${snap.size} accounts entering the 7-day window`)

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      if (data.deletionWarningsSent) continue // already warned, skip
      if (!data.email) continue

      const deletionDate = new Date(data.deactivatedAt + THIRTY_DAYS_MS)
      const formattedDate = deletionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      try {
        await resend.emails.send({
          from: 'Study Buddy <support@studybuddyph.site>',
          to: data.email,
          subject: 'Your Study Buddy account will be permanently deleted in 7 days',
          html: emailTemplate(`
            <p style="font-size:16px; margin-bottom:8px;">Heads up! ⏳</p>
            <p style="font-size:15px; line-height:1.6; color:#444;">
              Your <strong style="color:#195791;">Study Buddy</strong> account is scheduled for permanent deletion on <strong style="color:#195791;">${formattedDate}</strong> — about 7 days from now.
            </p>
            <p style="font-size:15px; line-height:1.6; color:#444;">
              Log back in before then to reactivate your account and keep your notes, courses, and study history. Once deleted, this cannot be undone.
            </p>
            ${actionButton('https://studybuddyph.site/', 'Log In to Reactivate')}
          `),
        })
        await docSnap.ref.update({ deletionWarningsSent: true })
        console.log(`[warnPendingDeletions] Warned ${docSnap.id}`)
      } catch (err) {
        console.error(`Failed to send deletion warning to ${docSnap.id}:`, err)
      }
    }
  }
)

// ── FINAL CLEANUP (unchanged 30-day trigger, now with full recursive delete) ──
export const cleanupDeactivatedAccounts = onSchedule(
  { schedule: 'every 24 hours', secrets: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] },
  async () => {
    const cutoff = Date.now() - THIRTY_DAYS_MS

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
        // 1. Clean up Cloudinary assets first (needs the docs to still exist to find publicIds)
        await cleanupCloudinaryAssets(uid)

        // 2. Delete all known subcollections
        const subcollections = [
          'courses', // recurses into files internally
          'notes',
          'flashcardHistory',
          'quizHistory',
          'schedules',
          'tasks',
          'recentlyDeleted',
        ]
        for (const sub of subcollections) {
          await deleteSubcollection(docSnap.ref, sub)
        }

        // 3. Delete Firebase Auth user
        await admin.auth().deleteUser(uid).catch((err) => {
          console.error(`Failed to delete Auth user ${uid}:`, err)
        })

        // 4. Delete emails/{email} lookup doc
        if (data?.email) {
          await admin.firestore().doc(`emails/${data.email}`).delete().catch(() => null)
        }

        // 5. Finally delete the user doc itself
        await docSnap.ref.delete()
        console.log(`[cleanupDeactivatedAccounts] Deleted user ${uid}`)
      } catch (err) {
        console.error(`[cleanupDeactivatedAccounts] Failed to fully clean up ${uid}:`, err)
      }
    }
  }
)