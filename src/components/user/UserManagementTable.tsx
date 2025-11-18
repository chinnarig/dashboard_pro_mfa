'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    MoreHorizontal,
    Search,
    UserCog,
    Trash2,
    Shield,
    User,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface UserData {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
}

interface UserManagementTableProps {
    users: UserData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    searchParams: {
        search?: string;
        role?: string;
        page?: string;
    };
}

export function UserManagementTable({
    users,
    pagination,
    searchParams,
}: UserManagementTableProps) {
    const router = useRouter();
    const params = useSearchParams();
    const { toast } = useToast();
    const [search, setSearch] = useState(searchParams.search || '');
    const [selectedRole, setSelectedRole] = useState(searchParams.role || 'ALL');
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedRole !== 'ALL') params.set('role', selectedRole);
        router.push(`/dashboard/users?${params.toString()}`);
    };

    const handleRoleFilter = (role: string) => {
        setSelectedRole(role);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (role !== 'ALL') params.set('role', role);
        router.push(`/dashboard/users?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedRole !== 'ALL') params.set('role', selectedRole);
        params.set('page', page.toString());
        router.push(`/dashboard/users?${params.toString()}`);
    };

    const handleChangeRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update role');
            }

            toast({
                title: 'Success',
                description: `User role updated to ${newRole}`,
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            toast({
                title: 'Success',
                description: 'User deleted successfully',
            });

            setUserToDelete(null);
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            {/* <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                    <Input
                        placeholder="Search users by name, username, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={handleSearch}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>
                <Select value={selectedRole} onValueChange={handleRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div> */}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>
                                                    {user.fullName?.charAt(0) || user.email.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {user.fullName || 'No name'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    @{user.username || 'no-username'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                                        >
                                            {user.role === 'ADMIN' ? (
                                                <Shield className="h-3 w-3 mr-1" />
                                            ) : (
                                                <User className="h-3 w-3 mr-1" />
                                            )}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(`/admin/dashboard/users/${user.id}`)
                                                    }
                                                >
                                                    <UserCog className="h-4 w-4 mr-2" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                {user.role === 'USER' ? (
                                                    <DropdownMenuItem
                                                        onClick={() => handleChangeRole(user.id, 'ADMIN')}
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleChangeRole(user.id, 'USER')}
                                                    >
                                                        <User className="h-4 w-4 mr-2" />
                                                        Remove Admin
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setUserToDelete(user)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!userToDelete}
                onOpenChange={() => setUserToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user{' '}
                            <strong>{userToDelete?.name || userToDelete?.email}</strong> and
                            all their posts and comments. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete User'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}