import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations/schemas';

// GET /api/users/[id] - Get user profile
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
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
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.id !== id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const validated = updateProfileSchema.parse(body);

        // Check if username is taken
        if (validated.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: validated.username,
                    NOT: { id },
                },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Username already taken' },
                    { status: 400 }
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: validated,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                bio: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}