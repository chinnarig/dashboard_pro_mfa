import { NextResponse } from 'next/server';
import { verifyResetToken, clearResetToken } from '@/lib/tokens';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const validation = resetPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { token, password } = validation.data;

        // Verify reset token
        const result = await verifyResetToken(token);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update user password
        await prisma.user.update({
            where: { id: result?.user?.id },
            data: {
                password: hashedPassword,
            },
        });

        // Clear reset token
        await clearResetToken(result?.user?.id);

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully! You can now log in with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}