import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MfaSettings } from '@/components/auth/MfaSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Security Settings',
  description: 'Manage your account security settings',
};

export default async function SecuritySettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.email) {
    redirect('/login');
  }

  // Get user's MFA status
  const user = await prisma.user.findUnique({
    where: { email: currentUser.email },
    select: {
      mfaEnabled: true,
      lastLogin: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security and two-factor authentication
          </p>
        </div>

        <Separator />

        <div className="space-y-6">
          <MfaSettings mfaEnabled={user.mfaEnabled} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Keep track of your account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.lastLogin ? (
                <p className="text-sm text-muted-foreground">
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent login activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
