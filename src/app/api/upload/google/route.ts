import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    generateBlobName,
    uploadFile,
    ensureBucketExists,
    getPublicUrl,
} from '@/lib/google-storage';

// Maximum file size (4MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
];

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only images are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
                { status: 400 }
            );
        }

        // Ensure bucket exists (optional - usually pre-created)
        // await ensureBucketExists();

        // Generate unique blob name
        const blobName = generateBlobName(file.name);

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Google Cloud Storage
        const fileUrl = await uploadFile(blobName, buffer, file.type);

        // Return the file URL
        return NextResponse.json({
            success: true,
            url: fileUrl,
            blobName,
            size: file.size,
            type: file.type,
        });

    } catch (error: any) {
        console.error('GCS upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

// Optional: Get public URL for a file
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');

        if (!fileName) {
            return NextResponse.json(
                { error: 'File name is required' },
                { status: 400 }
            );
        }

        const blobName = generateBlobName(fileName);
        const publicUrl = getPublicUrl(blobName);

        return NextResponse.json({
            blobName,
            url: publicUrl,
        });

    } catch (error: any) {
        console.error('URL generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate URL' },
            { status: 500 }
        );
    }
}