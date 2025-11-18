import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UsersTable from '@/components/user/UsersTable';

interface User {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    bio: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        accounts: number;
        sessions: number;
    };
}

async function getUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                isEmailVerified: true,
                image: true,
                bio: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        accounts: true,
                        sessions: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export default async function UsersPage() {
    const session = await getServerSession();

    if (!session) {
        redirect('/login');
    }

    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage and view all system users
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading...</div>}>
                        <UsersTable users={users} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}