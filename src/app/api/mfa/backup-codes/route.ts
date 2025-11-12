import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBackupCodes, encryptBackupCodes } from '@/lib/mfa';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user MFA status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is not enabled' },
        { status: 400 }
      );
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(8);
    const encryptedBackupCodes = encryptBackupCodes(backupCodes);

    // Update user with new backup codes
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaBackupCodes: encryptedBackupCodes,
      },
    });

    return NextResponse.json({
      message: 'Backup codes regenerated successfully',
      backupCodes,
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}
