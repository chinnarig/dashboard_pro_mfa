'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Pencil, Trash2, X, UserPlus, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

interface UsersTableProps {
    users: User[];
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function UsersTable({ users: initialUsers }: UsersTableProps) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN'>('all');
    const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state for editing/creating
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        bio: '',
        role: 'USER',
        password: '',
    });

    const filteredUsers = useMemo(() => {
        let filtered = [...users];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.name?.toLowerCase().includes(query) ||
                    user.username?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }

        // Verified filter
        if (verifiedFilter !== 'all') {
            filtered = filtered.filter((user) =>
                verifiedFilter === 'verified' ? user.emailVerified !== null : user.emailVerified === null
            );
        }

        return filtered;
    }, [users, searchQuery, roleFilter, verifiedFilter]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setVerifiedFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' || roleFilter !== 'all' || verifiedFilter !== 'all';

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            username: user.username || '',
            email: user.email,
            bio: user.bio || '',
            role: user.role,
            password: '',
        });
    };

    const openCreateDialog = () => {
        setIsCreateDialogOpen(true);
        setFormData({
            name: '',
            username: '',
            email: '',
            bio: '',
            role: 'USER',
            password: '',
        });
    };

    const closeDialogs = () => {
        setEditingUser(null);
        setIsCreateDialogOpen(false);
        setFormData({
            name: '',
            username: '',
            email: '',
            bio: '',
            role: 'USER',
            password: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = editingUser
                ? `/api/users/${editingUser.id}`
                : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (editingUser) {
                setUsers((prev) =>
                    prev.map((user) => (user.id === editingUser.id ? { ...user, ...data } : user))
                );
                toast.success('User updated successfully');
            } else {
                setUsers((prev) => [data, ...prev]);
                toast.success('User created successfully');
            }

            closeDialogs();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/users/${deletingUser.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            setUsers((prev) => prev.filter((user) => user.id !== deletingUser.id));
            toast.success('User deleted successfully');
            setDeletingUser(null);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters and Create Button */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Search</Label>
                    <Input
                        id="search"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mt-1.5"
                    />
                </div>
                <div className="w-[150px]">
                    <Label htmlFor="role-filter">Role</Label>
                    <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                        <SelectTrigger id="role-filter" className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[150px]">
                    <Label htmlFor="verified-filter">Verified</Label>
                    <Select
                        value={verifiedFilter}
                        onValueChange={(value: any) => setVerifiedFilter(value)}
                    >
                        <SelectTrigger id="verified-filter" className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                )}
                <Button onClick={openCreateDialog}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                </Button>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
            </div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-md">
                    {hasActiveFilters
                        ? 'No users match your filters. Try adjusting your search criteria.'
                        : 'No users found.'}
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name || <span className="text-muted-foreground italic">No name</span>}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.username || (
                                            <span className="text-muted-foreground italic">No username</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.emailVerified ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletingUser(user)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={editingUser !== null || isCreateDialogOpen} onOpenChange={closeDialogs}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Update user information below.'
                                : 'Fill in the details to create a new user.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="johndoe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Input
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="A short bio..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required={!editingUser}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialogs}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deletingUser !== null} onOpenChange={() => setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user{' '}
                            <strong>{deletingUser?.name || deletingUser?.email}</strong> and all associated data.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}