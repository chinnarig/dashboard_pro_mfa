import crypto from 'crypto';
import { prisma } from './prisma';
import type { User } from '@prisma/client';

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

// Define return types for better type safety
type TokenVerificationSuccess = {
    success: true;
    user: User;
    error?: never;
};

type TokenVerificationError = {
    success: false;
    user?: never;
    error: string;
};

type TokenVerificationResult = TokenVerificationSuccess | TokenVerificationError;

/**
 * Generate a random token
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create email verification token
 */
export async function createVerificationToken(userId: string): Promise<string> {
    // Generate raw token (this will be sent in email)
    const rawToken = generateToken();

    // Hash token for database storage
    const hashedToken = hashToken(rawToken);

    // Calculate expiry time
    const expires = new Date(Date.now() + TOKEN_EXPIRY);

    // Store hashed token in database
    await prisma.user.update({
        where: { id: userId },
        data: {
            verificationToken: hashedToken,
            verificationExpires: expires,
        },
    });

    // Return raw token (to be sent in email)
    return rawToken;
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<TokenVerificationResult> {
    // Hash the provided token to match against database
    const hashedToken = hashToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: hashedToken,
            verificationExpires: {
                gt: new Date(), // Token hasn't expired
            },
        },
    });

    if (!user) {
        return { success: false, error: 'Invalid or expired token' };
    }

    // Update user as verified and remove token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            verificationToken: null,
            verificationExpires: null,
        },
    });

    return { success: true, user };
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Don't reveal if user exists or not
        return null;
    }

    // Generate raw token
    const rawToken = generateToken();

    // Hash token for storage
    const hashedToken = hashToken(rawToken);

    // Calculate expiry time
    const expires = new Date(Date.now() + TOKEN_EXPIRY);

    // Store hashed token in database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetTokenExpires: expires,
        },
    });

    // Return raw token (to be sent in email)
    return rawToken;
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<TokenVerificationResult> {
    // Hash the provided token
    const hashedToken = hashToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpires: {
                gt: new Date(), // Token hasn't expired
            },
        },
    });

    if (!user) {
        return { success: false, error: 'Invalid or expired token' };
    }

    return { success: true, user };
}

/**
 * Clear password reset token after use
 */
export async function clearResetToken(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            resetToken: null,
            resetTokenExpires: null,
        },
    });
}

/**
 * Resend verification email (if not verified)
 */
export async function canResendVerification(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || user.emailVerified) {
        return false;
    }

    return true;
}