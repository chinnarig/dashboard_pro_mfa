'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import {
    User,
    LogOut,
    Settings,
    PenSquare,
    LayoutDashboard,
    Menu,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export function Header() {
    const { data: session, status } = useSession();
    const isLoading = status === 'loading';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                            Zlavox AI
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">

                        {/* {session?.user.role === 'ADMIN' && (
                            <Link
                                href="/dashboard"
                                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            >
                                Dashboard
                            </Link>
                        )} */}
                    </nav>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />

                    {/* Desktop User Menu */}
                    <div className="hidden sm:block">
                        {isLoading ? (
                            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        ) : session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                            <AvatarFallback>
                                                {getInitials(session.user.name || session.user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <div className="flex items-center justify-start gap-2 p-2">
                                        <div className="flex flex-col space-y-1 leading-none">
                                            {session.user.name && (
                                                <p className="font-medium">{session.user.name}</p>
                                            )}
                                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                                                @{session.user.username}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/profile/${session.user.username}`}>
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    {session.user.role === 'ADMIN' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/dashboard">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/dashboard/settings">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Settings
                                                </Link>
                                            </DropdownMenuItem>
                                        </>

                                    )}
                                    {session.user.role === 'USER' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/author/dashboard">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link href="/author/dashboard/settings">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Settings
                                                </Link>
                                            </DropdownMenuItem>
                                        </>

                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 dark:text-red-400"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href="/register">Sign Up</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="sm:hidden"
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle className="text-left">Menu</SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-4 mt-6">
                                {/* User Info (if logged in) */}
                                {session && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                            <AvatarFallback>
                                                {getInitials(session.user.name || session.user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            {session.user.name && (
                                                <p className="font-medium">{session.user.name}</p>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                @{session.user.username}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                <nav className="flex flex-col gap-2">
                                    <Link
                                        href="/blog"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span className="font-medium">Articles</span>
                                    </Link>

                                    {session ? (
                                        <>
                                            <Link
                                                href={`/profile/${session.user.username}`}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <User className="h-4 w-4" />
                                                <span>Profile</span>
                                            </Link>

                                            {session.user.role === 'ADMIN' && (
                                                <div>
                                                    <Link
                                                        href="/admin/dashboard"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <LayoutDashboard className="h-4 w-4" />
                                                        <span>Dashboard</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/dashboard/posts/new"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <PenSquare className="h-4 w-4" />
                                                        <span>New Post</span>
                                                    </Link>

                                                    <Link
                                                        href="/admin/dashboard//settings"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        <span>Settings</span>
                                                    </Link>
                                                </div>
                                            )}

                                            {session.user.role === 'USER' && (
                                                <div>
                                                    <Link
                                                        href="/author/dashboard"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <LayoutDashboard className="h-4 w-4" />
                                                        <span>Dashboard</span>
                                                    </Link>
                                                    <Link
                                                        href="/author/dashboard/posts/new"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <PenSquare className="h-4 w-4" />
                                                        <span>New Post</span>
                                                    </Link>

                                                    <Link
                                                        href="/author/dashboard/settings"
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        <span>Settings</span>
                                                    </Link>
                                                </div>
                                            )}

                                            <div className="border-t my-2" />

                                            <button
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    signOut({ callbackUrl: '/' });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-red-600 dark:text-red-400"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Log out</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <Button asChild onClick={() => setMobileMenuOpen(false)}>
                                                <Link href="/login">Login</Link>
                                            </Button>
                                            <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                                                <Link href="/register">Sign Up</Link>
                                            </Button>
                                        </div>
                                    )}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}