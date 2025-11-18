import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/form/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MfaSettings } from '@/components/auth/MfaSettings';
import { Separator } from '@/components/ui/separator';

export const metadata = {
    title: 'Settings | Zlavox AI',
    description: 'Manage your account settings',
};

async function getUserData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            image: true,
            bio: true,
            role: true,
            createdAt: true,
            mfaEnabled: true,
            lastLoginAt: true,
        },
    });

    return user;
}

export default async function SettingsPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    const user = await getUserData(currentUser.id);

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <ProfileForm user={user} />
                    </TabsContent>

                    {/* Account Tab */}
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                                <CardDescription>
                                    View your account details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Type</label>
                                    <p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Member Since</label>
                                    <p className="text-sm text-muted-foreground">
                                        {user.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <div className="space-y-6">
                            <MfaSettings mfaEnabled={user.mfaEnabled || false} />

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>
                                        Keep track of your account security
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user.lastLoginAt ? (
                                        <p className="text-sm text-muted-foreground">
                                            Last login: {new Date(user.lastLoginAt).toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No recent login activity
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Password</CardTitle>
                                    <CardDescription>
                                        Change your password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Password management coming soon
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preferences</CardTitle>
                                <CardDescription>
                                    Customize your experience
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Email Notifications</p>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email updates about your activity
                                            </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">Coming soon</div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Newsletter</p>
                                            <p className="text-sm text-muted-foreground">
                                                Weekly digest of top posts
                                            </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">Coming soon</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}