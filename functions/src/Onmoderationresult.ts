import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import { v2 as cloudinary } from 'cloudinary'

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/**
 * onModerationResult
 * Webhook Cloudinary calls when an async moderation scan finishes.
 * Set this function's URL as the Moderation notification URL in
 * Cloudinary Console → Settings → Notifications.
 */
export const onModerationResult = onRequest(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
    secrets: ['CLOUDINARY_API_SECRET'],
  },
  async (req, res) => {
    setCors(res)

    try {
      const timestamp = req.headers['x-cld-timestamp'] as string
      const signature = req.headers['x-cld-signature'] as string
      const rawBody = (req as any).rawBody.toString()

      const expectedSignature = crypto
        .createHash('sha1')
        .update(rawBody + timestamp + process.env.CLOUDINARY_API_SECRET)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.warn('onModerationResult: signature mismatch, rejecting')
        res.status(401).send('Invalid signature')
        return
      }

      const payload = JSON.parse(rawBody)
      const publicId: string = payload.public_id
      const moderationStatus: string = payload.moderation_status

      if (!publicId || !moderationStatus) {
        res.status(400).send('Missing fields')
        return
      }

      const match = publicId.match(/^users\/([^/]+)\/photos/)
      if (!match) {
        console.warn('onModerationResult: unrecognized public_id shape', publicId)
        res.status(200).send('Ignored')
        return
      }
      const uid = match[1]

      if (moderationStatus === 'rejected') {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        })
        await cloudinary.uploader.destroy(publicId)
        await admin.firestore().doc(`users/${uid}`).update({
          photoPublicId: admin.firestore.FieldValue.delete(),
          photoURL: admin.firestore.FieldValue.delete(),
          photoModerationStatus: 'rejected',
        })
      } else {
        await admin.firestore().doc(`users/${uid}`).update({
          photoModerationStatus: 'approved',
        })
      }

      res.status(200).send('OK')
    } catch (err: unknown) {
      console.error('onModerationResult error:', err)
      res.status(500).send('Webhook processing failed')
    }
  }
)