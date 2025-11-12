import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/schemas';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = registerSchema.parse(body);

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: validated.email },
                    { username: validated.username },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.email === validated.email) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 400 }
                );
            }
            if (existingUser.username === validated.username) {
                return NextResponse.json(
                    { error: 'Username already taken' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validated.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: validated.name,
                username: validated.username,
                email: validated.email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(
            { message: 'User created successfully', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}