import VoiceManagement from "@/components/voice/VoiceManagement";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';

interface SearchParams {
    search?: string;
    role?: string;
    page?: string;
}

async function getUsers(searchParams: SearchParams) {
    const page = parseInt(searchParams.page || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (searchParams.search) {
        where.OR = [
            { name: { contains: searchParams.search, mode: 'insensitive' } },
            { username: { contains: searchParams.search, mode: 'insensitive' } },
            { email: { contains: searchParams.search, mode: 'insensitive' } },
        ];
    }

    // Role filter
    if (searchParams.role && searchParams.role !== 'ALL') {
        where.role = searchParams.role;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                role: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
        redirect('/');
    }

    const { users, pagination } = await getUsers({} as SearchParams);

    return <VoiceManagement users={users} />;
}