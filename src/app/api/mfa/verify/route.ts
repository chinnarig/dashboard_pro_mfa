import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { decryptData, verifyTotpCode, decryptBackupCodes } from '@/lib/mfa';

export async function POST(req: NextRequest) {
  try {
    const { email, password, code } = await req.json();

    if (!email || !password || !code) {
      return NextResponse.json(
        { error: 'Email, password, and code are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if MFA is enabled
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Check if it's a backup code first
    if (user.mfaBackupCodes) {
      try {
        const backupCodes = decryptBackupCodes(user.mfaBackupCodes);
        const normalizedCode = code.replace(/-/g, '').toUpperCase();
        const codeIndex = backupCodes.findIndex(
          bc => bc.replace(/-/g, '').toUpperCase() === normalizedCode
        );
        
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          const { encryptBackupCodes } = await import('@/lib/mfa');
          await prisma.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: encryptBackupCodes(backupCodes) },
          });

          return NextResponse.json({
            success: true,
            message: 'Backup code verified successfully',
            backupCodeUsed: true,
          });
        }
      } catch (e) {
        // If backup codes can't be decrypted, continue to TOTP verification
        console.error('Failed to decrypt backup codes:', e);
      }
    }

    // Verify TOTP code
    try {
      const decryptedSecret = decryptData(user.mfaSecret);
      const isValid = verifyTotpCode(decryptedSecret, code);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid MFA code' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'MFA code verified successfully',
        backupCodeUsed: false,
      });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return NextResponse.json(
        { error: 'Invalid MFA code' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA' },
      { status: 500 }
    );
  }
}
