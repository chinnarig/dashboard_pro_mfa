import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateMfaSecret,
  getTotpUri,
  generateQrCode,
  encryptData,
  formatSecretForManualEntry,
} from '@/lib/mfa';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if MFA is already enabled
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

    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled' },
        { status: 400 }
      );
    }

    // Generate new secret
    const secret = generateMfaSecret();
    
    // Generate provisioning URI
    const uri = getTotpUri(secret, session.user.email);
    
    // Generate QR code
    const qrCode = await generateQrCode(uri);
    
    // Store encrypted secret temporarily (will be confirmed on enable)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaSecret: encryptData(secret),
      },
    });
    
    return NextResponse.json({
      secret,
      qrCode,
      manualEntryKey: formatSecretForManualEntry(secret),
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}
