import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, FileText, Users, Settings, LogOut } from 'lucide-react';
import { LogoutButton } from '@/components/user/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
        redirect('/');
    }

    const userInitials = user.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user.email?.charAt(0).toUpperCase() || 'U';

    return (
        <>
            <div className="flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-muted/40 flex flex-col h-full">
                    {/* User Profile Section */}
                    <div className="p-6 pb-4 shrink-0">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                                <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {user.name || 'Admin User'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 px-6 flex-1 overflow-y-auto">
                        <Link href="/admin/dashboard">
                            <Button variant="ghost" className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/voices">
                            <Button variant="ghost" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Create Agents
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/agents">
                            <Button variant="ghost" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Agents
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/users">
                            <Button variant="ghost" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Users
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/billing">
                            <Button variant="ghost" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Billing
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                    </nav>

                    {/* Logout Button */}
                    <div className="p-6 pt-4 shrink-0">
                        <Separator className="mb-4" />
                        <LogoutButton />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
        </>
    );
}