import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

import { hash } from 'bcryptjs';

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                isEmailVerified: true,
                image: true,
                bio: true,
                role: true,
                orgProjectId: true,
                mfaEnabled: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            where: {
                deletedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}


export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { fullName, username, email, password, bio, role, orgProjectId } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 400 }
            );
        }

        // Check if username already exists (if provided)
        if (username) {
            const existingUsername = await prisma.user.findUnique({
                where: { username },
            });

            if (existingUsername) {
                return NextResponse.json(
                    { error: 'Username already in use' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName,
                username,
                email,
                password: hashedPassword,
                bio,
                role: role || 'Read',
                orgProjectId,
                authMethod: 'password',
                isActive: true,
                isEmailVerified: false,
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                isEmailVerified: true,
                image: true,
                bio: true,
                role: true,
                orgProjectId: true,
                mfaEnabled: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}