import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  verifyTotpCode,
  decryptData,
  generateBackupCodes,
  encryptBackupCodes,
} from '@/lib/mfa';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid MFA code' },
        { status: 400 }
      );
    }

    // Get user with MFA secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled' },
        { status: 400 }
      );
    }

    if (!user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA setup not started. Please call /api/mfa/setup first' },
        { status: 400 }
      );
    }

    // Decrypt and verify the code
    const secret = decryptData(user.mfaSecret);
    const isValid = verifyTotpCode(secret, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid MFA code' },
        { status: 401 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);
    const encryptedBackupCodes = encryptBackupCodes(backupCodes);

    // Enable MFA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: encryptedBackupCodes,
      },
    });

    return NextResponse.json({
      message: 'MFA has been enabled successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable MFA' },
      { status: 500 }
    );
  }
}
