'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/blog/ImageUpload';
import { BioEditor } from '@/components/editor/BioEditor';

const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    bio: z.string().max(500).optional().nullable(),
    image: z.string().url().optional().nullable(),
    role: z.enum(['USER', 'ADMIN']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserEditFormProps {
    user: {
        id: string;
        name: string | null;
        username: string | null;
        email: string;
        image: string | null;
        bio: string | null;
        role: string;
    };
}

export function UserEditForm({ user }: UserEditFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(user.image || '');
    const [bio, setBio] = useState(user.bio || '');

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: user.fullName || '',
            username: user.username || '',
            bio: user.bio || '',
            image: user.image || '',
            role: user.role as 'USER' | 'ADMIN',
        },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: UserFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    bio,
                    image: profileImage || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update user');
            }

            toast({
                title: 'Success',
                description: 'User updated successfully',
            });

            router.push('/dashboard/users');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Edit User</CardTitle>
                    <CardDescription>
                        Update user information and permissions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <ImageUpload
                            value={profileImage}
                            onChange={(url) => {
                                setProfileImage(url);
                                setValue('image', url);
                            }}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="User's full name"
                            {...register('name')}
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                            id="username"
                            placeholder="username"
                            {...register('username')}
                            disabled={isLoading}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                        </p>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value: 'USER' | 'ADMIN') => setValue('role', value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Admins have full access to all features and settings
                        </p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <BioEditor
                            content={bio}
                            onChange={(html) => {
                                setBio(html);
                                setValue('bio', html);
                            }}
                            placeholder="User bio..."
                            disabled={isLoading}
                            maxLength={500}
                        />
                        {errors.bio && (
                            <p className="text-sm text-red-500">{errors.bio.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
                <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/users')}
                    disabled={isLoading}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                </Button>
            </div>
        </div>
    );
}