import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Users, Settings } from 'lucide-react';
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

    return (
        <>
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-muted/40 p-6">
                    <nav className="space-y-2">
                        <Link href="/admin/dashboard">
                            <Button variant="ghost" className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/admin/dashboard/voices">
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
                        <Link href="/admin/dashboard/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">{children}</main>
            </div>
        </>
    );
}