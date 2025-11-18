import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials, formatDate } from '@/lib/utils';
import { Calendar, Mail } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

interface ProfilePageProps {
    params: Promise<{
        username: string;
    }>;
}

async function getUser(username: string) {
    const user = await prisma.user.findUnique({
        where: { username },
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

export async function generateMetadata({
    params,
}: ProfilePageProps): Promise<Metadata> {
    const { username } = await params;
    const user = await getUser(username);

    if (!user) {
        return {
            title: 'User Not Found',
        };
    }

    return {
        title: `${user.fullName || user.username} | Zlavox AI`,
        description: user.bio || `Profile of ${user.fullName || user.username}`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const user = await getUser(username);
    const currentUser = await getCurrentUser();

    if (!user) {
        notFound();
    }

    const getProfileUrl = () => {
        if (user.role === 'ADMIN') {
            return `/admin/dashboard/settings`;
        }
        return `/author/dashboard/settings`;
    };

    const isOwnProfile = currentUser?.id === user.id;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.image || ''} alt={user.fullName || ''} />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(user?.name || user?.username || "")}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-1">
                                            {user.fullName || `@${user.username}`}
                                        </h1>
                                        <p className="text-muted-foreground">@{user.username}</p>
                                    </div>
                                    {isOwnProfile && (
                                        <Button variant="outline" asChild>
                                            <Link href={getProfileUrl()}>Edit Profile</Link>
                                        </Button>
                                    )}
                                </div>

                                {user.bio && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold mb-2">Bio</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Joined {formatDate(user.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}