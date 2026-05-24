import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const deleteCloudinaryAsset = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in to delete files.')
  }

  const { publicId, resourceType = 'image' } = request.data as {
    publicId: string
    resourceType?: 'image' | 'raw' | 'video'
  }

  if (!publicId) {
    throw new HttpsError('invalid-argument', 'publicId is required.')
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    return { success: true }
  } catch (err) {
    throw new HttpsError('internal', 'Failed to delete asset from Cloudinary.')
  }
})