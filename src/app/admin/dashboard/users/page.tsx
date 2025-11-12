import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserManagementTable } from '@/components/user/UserManagementTable';

export const metadata = {
    title: 'User Management | Admin Dashboard',
    description: 'Manage users and their permissions',
};

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
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
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

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const currentUser = await getCurrentUser();

    // Check if user is admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
        redirect('/');
    }
    const resolvedSearchParams = await searchParams;
    const { users, pagination } = await getUsers(resolvedSearchParams);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage users, roles, and permissions
                </p>
            </div>

            <UserManagementTable
                users={users}
                pagination={pagination}
                searchParams={resolvedSearchParams}
            />
        </div>
    );
}