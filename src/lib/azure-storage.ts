import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

// Azure Storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'blog-images';

if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials are not configured');
}

// Create shared key credential
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

// Create BlobServiceClient
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);

/**
 * Get container client
 */
export function getContainerClient() {
    return blobServiceClient.getContainerClient(containerName);
}

/**
 * Generate a unique blob name
 */
export function generateBlobName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Generate SAS token for upload
 */
export function generateUploadSasToken(blobName: string): string {
    const containerClient = getContainerClient();
    const blobClient = containerClient.getBlobClient(blobName);

    const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('w'), // Write permission
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
}

/**
 * Upload blob directly (server-side)
 */
export async function uploadBlob(
    blobName: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
            blobContentType: contentType,
        },
    });

    return blockBlobClient.url;
}

/**
 * Delete blob
 */
export async function deleteBlob(blobName: string): Promise<void> {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
}

/**
 * Check if container exists, create if not
 */
export async function ensureContainerExists(): Promise<void> {
    const containerClient = getContainerClient();
    const exists = await containerClient.exists();

    if (!exists) {
        await containerClient.create({
            access: 'blob', // Public read access for blobs
        });
        console.log(`Container "${containerName}" created`);
    }
}

/**
 * Get blob URL
 */
export function getBlobUrl(blobName: string): string {
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
}