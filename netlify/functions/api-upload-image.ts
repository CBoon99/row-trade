/**
 * Upload Image Function
 * Handles image uploads for listings, reviews, avatars
 * Uses Netlify Blobs for storage
 */

import { Handler } from '@netlify/functions';
import { getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        // For MVP, we'll use data URLs or Cloudinary
        // Netlify Blobs would require @netlify/blobs package
        // For now, return a placeholder URL structure
        
        // In production, you would:
        // 1. Parse multipart/form-data
        // 2. Validate image (size, type)
        // 3. Upload to Netlify Blobs or Cloudinary
        // 4. Return public URL
        
        // For MVP, accept base64 data URL
        const body = JSON.parse(event.body || '{}');
        const { imageData, type } = body; // imageData is base64 data URL
        
        if (!imageData) {
            return { statusCode: 400, body: JSON.stringify({ error: 'imageData required' }) };
        }
        
        // Validate it's a data URL
        if (!imageData.startsWith('data:image/')) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image data' }) };
        }
        
        // For MVP, return the data URL as-is (in production, upload to Blobs/Cloudinary)
        // In production: const blobUrl = await uploadToBlobs(imageData, user.id, type);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                imageUrl: imageData, // In production, this would be the Blob/Cloudinary URL
                message: 'Image uploaded (MVP mode - using data URL)',
            }),
        };
    } catch (error: any) {
        console.error('Error uploading image:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
