import { onRequest } from 'firebase-functions/v2/https'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export const deleteCloudinaryAsset = onRequest(
  { secrets: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const { publicId, resourceType = 'raw' } = req.body as {
      publicId: string
      resourceType?: 'image' | 'raw' | 'video'
    }

    if (!publicId) { res.status(400).json({ error: 'publicId is required.' }); return }

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
      res.status(200).json({ success: true })
    } catch (err) {
      console.error('Cloudinary delete error:', err)
      res.status(500).json({ error: 'Failed to delete asset from Cloudinary.' })
    }
  }
)