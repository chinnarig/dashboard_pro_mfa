import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationToken, canResendVerification } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user can resend verification
        const canResend = await canResendVerification(email);

        if (!canResend) {
            return NextResponse.json(
                { error: 'Email already verified or user not found' },
                { status: 400 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create new verification token
        const token = await createVerificationToken(user.id);

        // Send verification email
        await sendVerificationEmail(email, token);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully!',
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}