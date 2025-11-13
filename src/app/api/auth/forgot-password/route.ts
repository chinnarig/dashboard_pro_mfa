import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const validation = forgotPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        // Create password reset token
        const token = await createPasswordResetToken(email);

        if (token) {
            // Send password reset email
            await sendPasswordResetEmail(email, token);
        }

        // Always return success (don't reveal if user exists)
        // This prevents email enumeration attacks
        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, we sent a password reset link.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}