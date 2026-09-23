import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import Busboy from 'busboy'
import { v2 as cloudinary } from 'cloudinary'

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/**
 * uploadWithModeration
 * Uploads a user's profile photo to Cloudinary with AI moderation enabled.
 * Same auth pattern as deactivateAccount / reactivateAccount.
 */
export const uploadWithModeration = onRequest(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return }

    try {
      const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1])
      const uid = decoded.uid

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })

      const fileBuffer: Buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const bb = Busboy({ headers: req.headers })
        bb.on('file', (_field: string, stream: NodeJS.ReadableStream) => {
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        })
        bb.on('finish', () => resolve(Buffer.concat(chunks)))
        bb.on('error', reject)
        if (Buffer.isBuffer((req as any).rawBody)) {
          const { Readable } = require('stream')
          Readable.from((req as any).rawBody).pipe(bb)
        } else {
          req.pipe(bb)
        }
      })

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `users/${uid}/photos`,
            moderation: 'aws_rek',
            resource_type: 'image',
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        stream.end(fileBuffer)
      })

      const moderationStatus: string = uploadResult.moderation?.[0]?.status ?? 'pending'

      await admin.firestore().doc(`users/${uid}`).update({
        photoPublicId: uploadResult.public_id,
        photoURL: uploadResult.secure_url,
        photoModerationStatus: moderationStatus,
      })

      if (moderationStatus === 'rejected') {
        await cloudinary.uploader.destroy(uploadResult.public_id)
        await admin.firestore().doc(`users/${uid}`).update({
          photoPublicId: admin.firestore.FieldValue.delete(),
          photoURL: admin.firestore.FieldValue.delete(),
          photoModerationStatus: 'rejected',
        })
        res.status(422).json({ error: 'Image did not pass content review' })
        return
      }

      res.status(200).json({ status: moderationStatus, url: uploadResult.secure_url })
    } catch (err: unknown) {
      console.error('uploadWithModeration error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    }
  }
)