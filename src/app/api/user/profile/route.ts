import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2).max(50),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    bio: z.string().max(500).optional().nullable(),
    image: z.string().url().optional().nullable(),
});

export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate input
        const validationResult = updateProfileSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { name, username, bio, image } = validationResult.data;

        // Check if username is already taken (by another user)
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser && existingUser.id !== session.user.id) {
            return NextResponse.json(
                { error: 'Username is already taken' },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                username,
                bio: bio || null,
                image: image || null,
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                bio: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}

// Get current user profile
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                bio: true,
                role: true,
                created_at: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });

    } catch (error: any) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get profile' },
            { status: 500 }
        );
    }
}