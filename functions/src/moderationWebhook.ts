import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { v2 as cloudinary } from 'cloudinary'
import { deactivateAccountCore } from './accountActions'

if (!admin.apps.length) admin.initializeApp()

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

interface ModerationResultItem {
  kind: string
  status: 'approved' | 'rejected' | 'pending'
}

async function findCourseFileDoc(uid: string, courseId: string, publicId: string) {
  const filesRef = admin.firestore()
    .collection('users').doc(uid)
    .collection('courses').doc(courseId)
    .collection('files')
  const snap = await filesRef.where('publicId', '==', publicId).limit(1).get()
  return snap.empty ? null : snap.docs[0]
}

export const cloudinaryModerationWebhook = onRequest(
  { secrets: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_WEBHOOK_API_KEY', 'CLOUDINARY_WEBHOOK_API_SECRET', 'RESEND_API_KEY'] },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).send('Method not allowed'); return }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_WEBHOOK_API_KEY,
      api_secret: process.env.CLOUDINARY_WEBHOOK_API_SECRET,
    })
console.log('DEBUG secret check:', {
  length: process.env.CLOUDINARY_API_SECRET?.length,
  hasLeadingWhitespace: process.env.CLOUDINARY_API_SECRET !== process.env.CLOUDINARY_API_SECRET?.trimStart(),
  hasTrailingWhitespace: process.env.CLOUDINARY_API_SECRET !== process.env.CLOUDINARY_API_SECRET?.trimEnd(),
  firstChar: process.env.CLOUDINARY_API_SECRET?.[0],
  lastChar: process.env.CLOUDINARY_API_SECRET?.slice(-1),
})
    const signature = req.get('x-cld-signature')
    const timestamp = req.get('x-cld-timestamp')
    if (!signature || !timestamp) { res.status(400).send('Missing signature headers'); return }

    const rawBody = Buffer.isBuffer((req as any).rawBody)
      ? (req as any).rawBody.toString('utf8')
      : JSON.stringify(req.body)

const validSig = cloudinary.utils.verifyNotificationSignature(rawBody, Number(timestamp), signature)

// ── TEMP DEBUG: remove once confirmed working ──
const crypto = await import('crypto')
const expectedSigSha1 = crypto
  .createHash('sha1')
  .update(rawBody + timestamp + process.env.CLOUDINARY_API_SECRET)
  .digest('hex')
console.log('DEBUG signature check:', {
  receivedSignature: signature,
  expectedSignatureSha1: expectedSigSha1,
  match: expectedSigSha1 === signature,
})
// ── END TEMP DEBUG ──

if (!validSig) {
  console.warn('cloudinaryModerationWebhook: invalid signature, ignoring')
  res.status(401).send('Invalid signature')
  return
}

    try {
      const { public_id, moderation_status, moderation_response } = req.body as {
        public_id: string
        moderation_status: 'approved' | 'rejected' | 'pending'
        moderation_response?: ModerationResultItem[]
      }
      if (!public_id) { res.status(400).send('Missing public_id'); return }

      const parts = public_id.split('/')
      const isProfile = parts[0] === 'users' && parts[2]?.startsWith('profile_')
      const isCourseFile = parts[0] === 'users' && parts[2] === 'courses'

      if (!isProfile && !isCourseFile) {
        console.warn('Unrecognized public_id pattern, ignoring:', public_id)
        res.status(200).send('ignored')
        return
      }

      const uid = parts[1]
      const db = admin.firestore()

      if (moderation_status === 'approved') {
        if (isProfile) {
          await db.doc(`users/${uid}`).update({ photoModerationStatus: 'approved' })
        } else {
          const courseId = parts[3]
          const fileDoc = await findCourseFileDoc(uid, courseId, public_id)
          await fileDoc?.ref.update({ moderationStatus: 'approved' })
        }
        res.status(200).send('ok')
        return
      }

      if (moderation_status !== 'rejected') {
        res.status(200).send('ok') // still pending
        return
      }

      // ── rejected ─────────────────────────────────────────────────────
      const failedChecks = (moderation_response ?? [])
        .filter((m) => m.status === 'rejected')
        .map((m) => m.kind)
      const isMalware = failedChecks.includes('perception_point')

      if (isProfile) {
        await cloudinary.uploader.destroy(public_id, { resource_type: 'image' }).catch((e) =>
          console.error('Failed to delete rejected profile photo:', e)
        )
        await db.doc(`users/${uid}`).update({ photoModerationStatus: 'rejected' })
      } else {
        const courseId = parts[3]
        const fileDoc = await findCourseFileDoc(uid, courseId, public_id)
        if (fileDoc) {
          const data = fileDoc.data() as { fileType?: string; fileSizeBytes?: number }
          const resourceType = ['png', 'jpg', 'jpeg'].includes(data.fileType ?? '') ? 'image' : 'raw'
          await cloudinary.uploader.destroy(public_id, { resource_type: resourceType }).catch((e) =>
            console.error('Failed to delete rejected course file:', e)
          )
          await fileDoc.ref.delete()
          await db.doc(`users/${uid}/courses/${courseId}`).update({
            fileCount: admin.firestore.FieldValue.increment(-1),
          })
          if (data.fileSizeBytes) {
            await db.doc(`users/${uid}`).update({
              storageUsed: admin.firestore.FieldValue.increment(-data.fileSizeBytes),
            })
          }
        }
      }

      if (isMalware) {
        await deactivateAccountCore(uid, 'security_flag')
      }

      res.status(200).send('ok')
    } catch (err) {
      console.error('cloudinaryModerationWebhook error:', err)
      res.status(200).send('error-logged')
    }
  }
)