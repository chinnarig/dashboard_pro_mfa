import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const voiceSchema = z.object({
    name: z.string().min(1).optional(),
    accent: z.string().optional().nullable(),
    descriptive: z.string().optional().nullable(),
    age: z.string().optional(),
    gender: z.string().optional(),
    language: z.string().optional().nullable(),
    useCase: z.string().optional(),
    description: z.string().optional().nullable(),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validated = voiceSchema.parse(body);

        const voice = await prisma.voice.update({
            where: { id },
            data: {
                ...(validated.name && { name: validated.name }),
                ...(validated.accent !== undefined && { accent: validated.accent || null }),
                ...(validated.descriptive !== undefined && { descriptive: validated.descriptive || null }),
                ...(validated.age && { age: validated.age }),
                ...(validated.gender && { gender: validated.gender }),
                ...(validated.language !== undefined && { language: validated.language || null }),
                ...(validated.useCase && { useCase: validated.useCase }),
                ...(validated.description !== undefined && { description: validated.description || null }),
            },
        });

        return NextResponse.json({ success: true, voice });
    } catch (error: any) {
        console.error('Error updating voice:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to update voice' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.voice.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Voice deleted' });
    } catch (error: any) {
        console.error('Error deleting voice:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to delete voice' }, { status: 500 });
    }
}