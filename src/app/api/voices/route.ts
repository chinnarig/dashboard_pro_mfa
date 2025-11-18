import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const voiceSchema = z.object({
    voice_id: z.string().min(1, 'Voice ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    llm_id: z.string().min(1, 'LLM ID is required'),
    agent_id: z.string().min(1, 'Agent ID is required'),
    linked_number: z.string().min(1, 'Linked number is required'),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const userId = searchParams.get('userId') || '';
        const agent_id = searchParams.get('agent_id') || '';

        const where: any = {};

        if (search) {
            where.OR = [
                { voice_id: { contains: search, mode: 'insensitive' } },
                { linked_number: { contains: search, mode: 'insensitive' } },
                { userId: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (userId) where.userId = userId;
        if (agent_id) where.agent_id = agent_id;

        const [voices, total] = await Promise.all([
            prisma.voice.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.voice.count({ where }),
        ]);

        return NextResponse.json({
            voices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching voices:', error);
        return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validated = voiceSchema.parse(body);

        const voice = await prisma.voice.create({
            data: {
                voice_id: validated.voice_id,
                userId: validated.userId,
                llm_id: validated.llm_id,
                agent_id: validated.agent_id,
                linked_number: validated.linked_number,
            },
        });

        return NextResponse.json({ success: true, voice }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating voice:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create voice' }, { status: 500 });
    }
}