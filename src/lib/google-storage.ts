import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
});

const bucketName = process.env.GCS_BUCKET_NAME!;

/**
 * Ensure bucket exists (optional - usually buckets are pre-created)
 */
export async function ensureBucketExists() {
    try {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();

        if (!exists) {
            await storage.createBucket(bucketName, {
                location: 'US',
                storageClass: 'STANDARD',
            });
            console.log(`Bucket ${bucketName} created.`);
        }

        return true;
    } catch (error) {
        console.error('Error ensuring bucket exists:', error);
        throw error;
    }
}

/**
 * Generate a unique blob name
 */
export function generateBlobName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `uploads/${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload file to Google Cloud Storage
 */
export async function uploadFile(
    blobName: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(blobName);

        await file.save(buffer, {
            contentType,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Make the file publicly accessible
        await file.makePublic();

        // Return the public URL
        return `https://storage.googleapis.com/${bucketName}/${blobName}`;
    } catch (error) {
        console.error('Error uploading to GCS:', error);
        throw error;
    }
}

/**
 * Get a signed URL for temporary access (alternative to public URLs)
 */
export async function getSignedUrl(blobName: string): Promise<string> {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(blobName);

        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(blobName: string): Promise<void> {
    try {
        const bucket = storage.bucket(bucketName);
        await bucket.file(blobName).delete();
        console.log(`File ${blobName} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Get public URL for a blob
 */
export function getPublicUrl(blobName: string): string {
    return `https://storage.googleapis.com/${bucketName}/${blobName}`;
}