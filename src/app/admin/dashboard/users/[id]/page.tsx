import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserEditForm } from '@/components/user/UserEditForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, FileText, MessageSquare, ThumbsUp } from 'lucide-react';

async function getUserById(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            image: true,
            bio: true,
            role: true,
            createdAt: true,
        },
    });

    return user;
}

export default async function UserPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const currentUser = await getCurrentUser();

    const { id } = await params;

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'Admin')) {
        redirect('/');
    }

    const user = await getUserById(id);

    if (!user) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="text-2xl">
                            {user.fullName?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{user.fullName || 'No name'}</h1>
                        <p className="text-muted-foreground">@{user.username || 'no-username'}</p>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-2">
                            {user.role}
                        </Badge>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm font-medium">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Member Since</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Form */}
                <UserEditForm user={user} />
            </div>
        </div>
    );
}