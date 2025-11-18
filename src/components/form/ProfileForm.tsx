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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ImageUpload } from '../blog/ImageUpload';
import { BioEditor } from '../editor/BioEditor';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: {
        id: string;
        name: string | null;
        username: string | null;
        email: string;
        image: string | null;
        bio: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
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
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.fullName || '',
            username: user.username || '',
            bio: user.bio || '',
            image: user.image || '',
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    bio, // Use bio from state (TipTap editor)
                    image: profileImage || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update profile');
            }

            toast({
                title: 'Success',
                description: 'Profile updated successfully',
            });

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
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                    Update your profile details and picture
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
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
                        <p className="text-xs text-muted-foreground">
                            Upload a profile picture or paste an image URL
                        </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="Your full name"
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
                            placeholder="your_username"
                            {...register('username')}
                            disabled={isLoading}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            This will be used in your profile URL: /profile/{user.username || 'username'}
                        </p>
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

                    {/* Bio with TipTap Editor */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <BioEditor
                            content={bio}
                            onChange={(html) => {
                                setBio(html);
                                setValue('bio', html);
                            }}
                            placeholder="Tell us about yourself..."
                            disabled={isLoading}
                            maxLength={500}
                        />
                        {errors.bio && (
                            <p className="text-sm text-red-500">{errors.bio.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Brief description for your profile. Maximum 500 characters.
                        </p>
                    </div>

                    {/* Submit Button */}
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
                                'Save Changes'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}